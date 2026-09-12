import { useEffect, useState } from 'react'
import { supabase, supabaseReady } from '../supabaseClient'
import BarcodeScanner from '../components/BarcodeScanner'

const emptyForm = { id: null, name: '', category: '', price: '', stock: '', requires_rx: false, barcode: '', expiry_date: '' }

export default function Medicines() {
  const [medicines, setMedicines] = useState([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all') // all | low | expiring | rx
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [showBulk, setShowBulk] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showScanner, setShowScanner] = useState(false)

  async function load() {
    if (!supabaseReady) return
    const { data } = await supabase.from('medicines').select('*').order('name')
    setMedicines(data || [])
  }

  useEffect(() => {
    load()
    if (!supabaseReady) return
    const channel = supabase
      .channel('medicines-owner-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'medicines' }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const today = new Date()
  const in30 = new Date()
  in30.setDate(today.getDate() + 30)

  const filtered = medicines.filter(m => {
    if (!m.name.toLowerCase().includes(query.toLowerCase())) return false
    if (filter === 'low') return m.stock > 0 && m.stock <= 5
    if (filter === 'expiring') return m.expiry_date && new Date(m.expiry_date) <= in30
    if (filter === 'rx') return m.requires_rx
    return true
  })

  function openEdit(m) {
    setForm({
      id: m.id,
      name: m.name,
      category: m.category,
      price: m.price,
      stock: m.stock,
      requires_rx: m.requires_rx,
      barcode: m.barcode || '',
      expiry_date: m.expiry_date || '',
    })
    setShowForm(true)
  }

  function openNew() {
    setForm(emptyForm)
    setShowForm(true)
  }

  async function onBarcodeChange(value) {
    setForm(f => ({ ...f, barcode: value }))
    if (!value.trim()) return
    const existing = medicines.find(m => m.barcode === value.trim())
    if (existing && !form.id) {
      // repeat scan of a known barcode auto-fills details
      setForm({
        id: existing.id,
        name: existing.name,
        category: existing.category,
        price: existing.price,
        stock: existing.stock,
        requires_rx: existing.requires_rx,
        barcode: existing.barcode,
        expiry_date: existing.expiry_date || '',
      })
    }
  }

  async function saveForm() {
    if (!form.name.trim() || form.price === '' || form.stock === '') return
    setSaving(true)
    const row = {
      name: form.name.trim(),
      category: form.category.trim() || 'General',
      price: Number(form.price),
      stock: Number(form.stock),
      requires_rx: !!form.requires_rx,
      barcode: form.barcode.trim() || null,
      expiry_date: form.expiry_date || null,
    }
    if (form.id) {
      await supabase.from('medicines').update(row).eq('id', form.id)
    } else {
      await supabase.from('medicines').insert(row)
    }
    setSaving(false)
    setShowForm(false)
    setForm(emptyForm)
    load()
  }

  async function deleteMedicine(id) {
    if (!confirm('Remove this medicine from stock?')) return
    await supabase.from('medicines').delete().eq('id', id)
    load()
  }

  async function saveBulk() {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean)
    const rows = lines
      .map(line => {
        const parts = line.split(',').map(p => p.trim())
        const [name, category, price, stock, rx] = parts
        if (!name || price === undefined || stock === undefined) return null
        return {
          name,
          category: category || 'General',
          price: Number(price) || 0,
          stock: Number(stock) || 0,
          requires_rx: (rx || '').toLowerCase() === 'rx' || (rx || '').toLowerCase() === 'true',
        }
      })
      .filter(Boolean)
    if (rows.length === 0) return
    setSaving(true)
    await supabase.from('medicines').insert(rows)
    setSaving(false)
    setBulkText('')
    setShowBulk(false)
    load()
  }

  if (!supabaseReady) {
    return <div className="setup-banner">Connect Supabase to manage real stock — see README.</div>
  }

  return (
    <div>
      <div className="section-title">
        Stock ({medicines.length})
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              setForm(emptyForm)
              setShowScanner(true)
            }}
          >
            📷 Scan
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => setShowBulk(true)}>
            Bulk add
          </button>
          <button className="btn btn-primary btn-sm" onClick={openNew}>
            + Add
          </button>
        </div>
      </div>

      <div className="field">
        <input placeholder="Search stock…" value={query} onChange={e => setQuery(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {[
          ['all', 'All'],
          ['low', 'Low stock'],
          ['expiring', 'Expiring soon'],
          ['rx', 'Rx only'],
        ].map(([key, label]) => (
          <button
            key={key}
            className="btn btn-sm"
            style={{
              background: filter === key ? 'var(--blue)' : 'white',
              color: filter === key ? 'white' : 'var(--ink)',
              border: '1px solid var(--line)',
            }}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: '4px 14px' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">No medicines match.</div>
        ) : (
          filtered.map(m => {
            const expSoon = m.expiry_date && new Date(m.expiry_date) <= in30
            return (
              <div className="list-item" key={m.id}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                    {m.category} · ₹{Number(m.price).toFixed(0)} · stock {m.stock}
                  </div>
                  <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
                    {m.requires_rx && <span className="tag tag-rx">Rx</span>}
                    {m.stock <= 5 && <span className="tag tag-low">Low stock</span>}
                    {expSoon && <span className="tag tag-rx">Expiring soon</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => openEdit(m)}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteMedicine(m.id)}>
                    ✕
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title={form.id ? 'Edit medicine' : 'Add medicine'}>
          <div className="field">
            <label>Barcode</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={form.barcode}
                onChange={e => onBarcodeChange(e.target.value)}
                placeholder="Scan with camera, USB scanner, or type manually"
                style={{ flex: 1 }}
              />
              <button className="btn btn-outline" onClick={() => setShowScanner(true)}>
                📷 Scan
              </button>
            </div>
          </div>
          <div className="field">
            <label>Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Category</label>
              <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
            </div>
            <div className="field">
              <label>Price (₹)</label>
              <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Stock</label>
              <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
            </div>
            <div className="field">
              <label>Expiry date</label>
              <input type="date" value={form.expiry_date || ''} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, marginBottom: 16 }}>
            <input
              type="checkbox"
              checked={form.requires_rx}
              onChange={e => setForm(f => ({ ...f, requires_rx: e.target.checked }))}
            />
            Requires prescription (Schedule H/H1)
          </label>
          <button className="btn btn-primary btn-block" onClick={saveForm} disabled={saving}>
            {saving ? 'Saving…' : 'Save medicine'}
          </button>
        </Modal>
      )}

      {showBulk && (
        <Modal onClose={() => setShowBulk(false)} title="Bulk add medicines">
          <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: -4 }}>
            One medicine per line: <code>name, category, price, stock, rx</code> — last "rx" is optional
            (write "rx" for prescription-only).
          </p>
          <div className="field">
            <textarea
              rows={8}
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder={'Paracetamol 500mg, Fever & Pain, 25, 100\nAzithromycin 500mg, Antibiotic, 85, 40, rx'}
            />
          </div>
          <button className="btn btn-primary btn-block" onClick={saveBulk} disabled={saving}>
            {saving ? 'Adding…' : 'Add all'}
          </button>
        </Modal>
      )}

      {showScanner && (
        <BarcodeScanner
          onDetected={code => {
            onBarcodeChange(code)
            setShowScanner(false)
            setShowForm(true)
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex',
        alignItems: 'flex-end', justifyContent: 'center', zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: '100%', maxWidth: 480, borderRadius: '18px 18px 0 0', padding: 18, maxHeight: '88vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18 }}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
