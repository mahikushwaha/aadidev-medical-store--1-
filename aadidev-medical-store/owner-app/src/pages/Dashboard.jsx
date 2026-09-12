import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, supabaseReady } from '../supabaseClient'

export default function Dashboard() {
  const [stats, setStats] = useState({ pending: 0, expiring: 0, plans: 0, lowStock: 0, medicines: 0 })

  useEffect(() => {
    if (!supabaseReady) return
    async function load() {
      const [{ data: orders }, { data: meds }, { data: plans }] = await Promise.all([
        supabase.from('orders').select('status'),
        supabase.from('medicines').select('stock, expiry_date'),
        supabase.from('plan_requests').select('status'),
      ])
      const today = new Date()
      const in30 = new Date()
      in30.setDate(today.getDate() + 30)

      setStats({
        pending: (orders || []).filter(o => o.status === 'Pending').length,
        expiring: (meds || []).filter(m => m.expiry_date && new Date(m.expiry_date) <= in30).length,
        lowStock: (meds || []).filter(m => m.stock > 0 && m.stock <= 5).length,
        plans: (plans || []).filter(p => p.status === 'New').length,
        medicines: (meds || []).length,
      })
    }
    load()
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'medicines' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plan_requests' }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  return (
    <div>
      {!supabaseReady && (
        <div className="setup-banner">
          Not connected to Supabase yet. Add your project URL and anon key to the .env file — see README.
        </div>
      )}

      <div className="section-title">Today at a glance</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
        <StatCard label="Pending orders" value={stats.pending} to="/orders" accent="var(--blue)" />
        <StatCard label="New plan requests" value={stats.plans} to="/more" accent="var(--green)" />
        <StatCard label="Expiring in 30 days" value={stats.expiring} to="/medicines" accent="#c0392b" />
        <StatCard label="Low stock (≤5)" value={stats.lowStock} to="/medicines" accent="#9a6b00" />
      </div>

      <div className="section-title">Quick actions</div>
      <div className="card" style={{ padding: '4px 14px' }}>
        <Link to="/medicines" className="list-item">
          <span>💊 Add or edit medicines</span>
          <span>›</span>
        </Link>
        <Link to="/orders" className="list-item">
          <span>📦 Update order status</span>
          <span>›</span>
        </Link>
        <Link to="/chats" className="list-item">
          <span>💬 Reply to customer chats</span>
          <span>›</span>
        </Link>
        <Link to="/more" className="list-item" style={{ borderBottom: 'none' }}>
          <span>⚙️ Delivery zones & pricing</span>
          <span>›</span>
        </Link>
      </div>
    </div>
  )
}

function StatCard({ label, value, to, accent }) {
  return (
    <Link to={to} className="card" style={{ padding: 14, borderLeft: `4px solid ${accent}` }}>
      <div style={{ fontSize: 24, fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>{label}</div>
    </Link>
  )
}
