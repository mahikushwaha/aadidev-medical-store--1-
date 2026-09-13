import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, supabaseReady } from '../supabaseClient'
import { useCart } from '../CartContext'
import { useAuth } from '../AuthContext'

export default function Track() {
  const { showToast } = useCart()
  const cartCtx = useCart()
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  async function load() {
    if (!supabaseReady || !user) {
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    if (!supabaseReady || !user) return
    const channel = supabase
      .channel(`my-orders-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  function reorder(order) {
    order.items.forEach(item => {
      cartCtx.addToCart({
        id: item.medicine_id,
        name: item.name,
        price: item.price,
        requires_rx: false,
      })
      for (let i = 1; i < item.qty; i++) {
        cartCtx.updateQty(item.medicine_id, 1)
      }
    })
    showToast('Items added to cart')
    navigate('/cart')
  }

  if (!supabaseReady) {
    return <div className="setup-banner">Order tracking needs Supabase connected — see README.</div>
  }

  return (
    <div>
      <div className="section-title">Your orders</div>

      {loading && <div className="empty-state">Loading…</div>}

      {!loading && orders.length === 0 && (
        <div className="empty-state">
          <div className="emoji">📦</div>
          No orders yet. Once you place one, it'll show up here automatically.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {orders.map(o => (
          <div className="card" key={o.id} style={{ padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 13.5 }}>{o.order_number}</span>
              <span className={`status-chip status-${o.status.replace(/ /g, '-')}`}>{o.status}</span>
            </div>
            {o.eta_text && (
              <div style={{ fontSize: 12, color: 'var(--blue-dark)', fontWeight: 600, marginTop: 4 }}>
                ⏱ Estimated delivery: {o.eta_text}
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '6px 0' }}>
              {o.items.map(i => `${i.name} ×${i.qty}`).join(', ')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700 }}>₹{Number(o.total).toFixed(0)}</span>
              <button className="btn btn-outline" onClick={() => reorder(o)}>
                Reorder
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}