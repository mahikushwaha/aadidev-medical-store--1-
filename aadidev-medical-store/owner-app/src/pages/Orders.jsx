import { useEffect, useState } from 'react'
import { supabase, supabaseReady } from '../supabaseClient'

const STATUSES = ['Pending', 'Out for delivery', 'Delivered']

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('active') // active | all | Delivered

  async function load() {
    if (!supabaseReady) return
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    setOrders(data || [])
  }

  useEffect(() => {
    load()
    if (!supabaseReady) return
    const channel = supabase
      .channel('orders-owner-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function updateStatus(id, status) {
    await supabase.from('orders').update({ status }).eq('id', id)
  }

  const filtered = orders.filter(o => {
    if (filter === 'active') return o.status !== 'Delivered'
    if (filter === 'Delivered') return o.status === 'Delivered'
    return true
  })

  if (!supabaseReady) {
    return <div className="setup-banner">Connect Supabase to see real orders — see README.</div>
  }

  return (
    <div>
      <div className="section-title">Orders</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[
          ['active', 'Active'],
          ['Delivered', 'Delivered'],
          ['all', 'All'],
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

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="emoji">📦</div>
          No orders here.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(o => (
            <div className="card" key={o.id} style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{o.order_number}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                    {o.customer_name} · {o.phone}
                  </div>
                </div>
                <span className={`status-chip status-${o.status.replace(/ /g, '-')}`}>{o.status}</span>
              </div>

              <div style={{ fontSize: 12.5, margin: '8px 0', color: 'var(--ink)' }}>
                {o.items.map((i, idx) => (
                  <div key={idx}>
                    {i.name} × {i.qty} — ₹{(i.price * i.qty).toFixed(0)}
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 6 }}>
                {o.address} {o.zone_name ? `(${o.zone_name})` : ''}
              </div>

              {o.rx_confirmed && (
                <div style={{ fontSize: 11.5, color: 'var(--danger)', marginBottom: 6 }}>
                  ⚠ Prescription order — verify before dispatch
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700 }}>₹{Number(o.total).toFixed(0)} · COD</span>
                <select
                  value={o.status}
                  onChange={e => updateStatus(o.id, e.target.value)}
                  style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '6px 8px', fontSize: 12.5 }}
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
