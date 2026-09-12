import { useEffect, useRef, useState } from 'react'
import { supabase, supabaseReady } from '../supabaseClient'

export default function Chats() {
  const [threads, setThreads] = useState([])
  const [activePhone, setActivePhone] = useState(null)
  const [text, setText] = useState('')
  const bottomRef = useRef(null)

  async function load() {
    if (!supabaseReady) return
    const { data } = await supabase.from('chat_threads').select('*').order('updated_at', { ascending: false })
    setThreads(data || [])
  }

  useEffect(() => {
    load()
    if (!supabaseReady) return
    const channel = supabase
      .channel('chats-owner-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_threads' }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activePhone, threads])

  const active = threads.find(t => t.customer_phone === activePhone)

  async function send() {
    if (!text.trim() || !active) return
    const msg = { from: 'owner', text: text.trim(), time: new Date().toISOString() }
    const messages = [...(active.messages || []), msg]
    await supabase
      .from('chat_threads')
      .update({ messages, updated_at: new Date().toISOString() })
      .eq('customer_phone', activePhone)
    setText('')
  }

  if (!supabaseReady) {
    return <div className="setup-banner">Connect Supabase to see customer chats — see README.</div>
  }

  if (activePhone && active) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '60vh' }}>
        <button className="back-link-btn" style={{ background: 'none', border: 'none', color: 'var(--blue)', fontWeight: 600, fontSize: 13, marginBottom: 10, textAlign: 'left', padding: 0 }} onClick={() => setActivePhone(null)}>
          ‹ All chats
        </button>
        <div className="section-title" style={{ marginBottom: 8 }}>
          {active.customer_name || 'Customer'} · {active.customer_phone}
        </div>
        <div className="chat-thread">
          {(active.messages || []).map((m, idx) => (
            <div className={`msg ${m.from}`} key={idx}>
              {m.text}
              <div className="time">{new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="chat-input-row">
          <input value={text} onChange={e => setText(e.target.value)} placeholder="Reply…" onKeyDown={e => e.key === 'Enter' && send()} />
          <button onClick={send}>➤</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="section-title">Customer chats</div>
      {threads.length === 0 ? (
        <div className="empty-state">
          <div className="emoji">💬</div>
          No chats yet.
        </div>
      ) : (
        <div className="card" style={{ padding: '4px 14px' }}>
          {threads.map(t => {
            const last = (t.messages || [])[t.messages.length - 1]
            return (
              <div className="list-item" key={t.id} onClick={() => setActivePhone(t.customer_phone)} style={{ cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{t.customer_name || t.customer_phone}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {last ? `${last.from === 'owner' ? 'You: ' : ''}${last.text}` : 'No messages'}
                  </div>
                </div>
                <span>›</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
