import { useState } from 'react'
import { supabase, supabaseReady } from '../supabaseClient'
import { useCart } from '../CartContext'
import { useAuth } from '../AuthContext'

export default function PlanRequest() {
  const { customerPhone, setCustomerPhone } = useCart()
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState(customerPhone || '')
  const [frequency, setFrequency] = useState('monthly')
  const [medicineList, setMedicineList] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const canSubmit = name.trim() && phone.trim().length >= 10 && medicineList.trim() && !submitting

  async function submit() {
    if (!canSubmit) return
    setSubmitting(true)
    if (supabaseReady) {
      await supabase.from('plan_requests').insert({
        customer_name: name.trim(),
        phone: phone.trim(),
        user_id: user?.id || null,
        frequency,
        medicine_list: medicineList.trim(),
        note: note.trim() || null,
        status: 'New',
      })
    }
    setCustomerPhone(phone.trim())
    setSubmitting(false)
    setDone(true)
  }

  if (done) {
    return (
      <div className="order-id-box">
        <div className="check">✓</div>
        <div style={{ fontWeight: 700, fontSize: 17 }}>Request sent!</div>
        <div style={{ color: 'var(--ink-soft)', fontSize: 13, marginTop: 4 }}>
          The owner will review your list and send you a custom price quote via chat or call.
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="section-title">Monthly / yearly medicine plan</div>
      <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: -6, marginBottom: 14 }}>
        Get a custom quote for medicines you take regularly — we'll deliver them on schedule.
      </p>

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
      <div className="field">
        <label>Plan frequency</label>
        <select value={frequency} onChange={e => setFrequency(e.target.value)}>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      <div className="field">
        <label>Medicines needed (name, dosage, quantity)</label>
        <textarea
          value={medicineList}
          onChange={e => setMedicineList(e.target.value)}
          placeholder={'e.g.\nTelmisartan 40mg — 1 strip/month\nMetformin 500mg — 2 strips/month'}
        />
      </div>
      <div className="field">
        <label>Note (optional)</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Anything else the owner should know" />
      </div>

      {!supabaseReady && (
        <div className="setup-banner">Connect Supabase to actually send this to the owner — see README.</div>
      )}

      <button className="btn btn-primary btn-block" disabled={!canSubmit} onClick={submit}>
        {submitting ? 'Sending…' : 'Send request'}
      </button>
    </div>
  )
}
