import { useEffect, useRef, useState } from 'react'
import { supabase, supabaseReady } from '../supabaseClient'
import { useCart } from '../CartContext'
import { useAuth } from '../AuthContext'

export default function Chat() {
  const { customerPhone, setCustomerPhone } = useCart()
  const { user } = useAuth()
  const [phone, setPhone] = useState(customerPhone || '')
  const [confirmed, setConfirmed] = useState(!!customerPhone)
  const [name, setName] = useState('')
  const [thread, setThread] = useState(null)
  const [text, setText] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!confirmed || !supabaseReady) return
    let channel
    async function load() {
      const { data } = await supabase
        .from('chat_threads')
        .select('*')
        .eq('customer_phone', phone)
        .maybeSingle()
      setThread(data)

      channel = supabase
        .channel(`chat-${phone}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'chat_threads', filter: `customer_phone=eq.${phone}` },
          payload => setThread(payload.new)
        )
        .subscribe()
    }
    load()
    return () => channel && supabase.removeChannel(channel)
  }, [confirmed, phone])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread])

  async function startChat() {
    if (phone.trim().length < 10) return
    setCustomerPhone(phone.trim())
    setConfirmed(true)
  }

  async function send() {
    if (!text.trim() || !supabaseReady) return
    const msg = { from: 'customer', text: text.trim(), time: new Date().toISOString() }
    const messages = [...(thread?.messages || []), msg]

    if (thread) {
      const { data } = await supabase
        .from('chat_threads')
        .update({ messages, updated_at: new Date().toISOString(), customer_name: name || thread.customer_name })
        .eq('customer_phone', phone)
        .select()
        .single()
      setThread(data)
    } else {
      const { data } = await supabase
        .from('chat_threads')
        .insert({ customer_phone: phone, customer_name: name, user_id: user?.id || null, messages })
        .select()
        .single()
      setThread(data)
    }
    setText('')
  }

  if (!supabaseReady) {
    return (
      <div className="setup-banner">
        Live chat needs Supabase connected — see README to go live.
      </div>
    )
  }

  if (!confirmed) {
    return (
      <div>
        <div className="section-title">Chat with the owner</div>
        <div className="field">
          <label>Your name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
        </div>
        <div className="field">
          <label>Phone number</label>
          <input
            value={phone}
            onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="10-digit mobile number"
            inputMode="numeric"
            maxLength={10}
          />
        </div>
        <button className="btn btn-primary btn-block" onClick={startChat} disabled={phone.trim().length < 10}>
          Start chat
        </button>
      </div>
    )
  }

  const messages = thread?.messages || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '60vh' }}>
      <div className="section-title">Chat with the owner</div>
      {messages.length === 0 ? (
        <div className="empty-state">
          <div className="emoji">💬</div>
          Say hello — the owner usually replies during store hours.
        </div>
      ) : (
        <div className="chat-thread">
          {messages.map((m, idx) => (
            <div className={`msg ${m.from}`} key={idx}>
              {m.text}
              <div className="time">
                {new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
      <div className="chat-input-row">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message…"
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <button onClick={send}>➤</button>
      </div>
    </div>
  )
}
