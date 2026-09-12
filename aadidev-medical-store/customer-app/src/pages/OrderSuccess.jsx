import { useLocation, useNavigate, Link } from 'react-router-dom'

export default function OrderSuccess() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const orderNumber = state?.orderNumber

  if (!orderNumber) {
    return (
      <div className="empty-state">
        No recent order found.
        <div style={{ marginTop: 14 }}>
          <Link to="/">
            <button className="btn btn-primary">Go home</button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="order-id-box">
      <div className="check">✓</div>
      <div style={{ fontWeight: 700, fontSize: 17 }}>Order placed!</div>
      <div style={{ color: 'var(--ink-soft)', fontSize: 13, marginTop: 4 }}>
        We've sent your order to Aadidev Medical Store.
      </div>
      <div className="oid">{orderNumber}</div>
      <button className="btn btn-outline btn-block" style={{ marginBottom: 10 }} onClick={() => navigate('/track')}>
        Track this order
      </button>
      <button className="btn btn-primary btn-block" onClick={() => navigate('/')}>
        Continue browsing
      </button>
    </div>
  )
}
