import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../CartContext'

export default function Cart() {
  const { cart, updateQty, removeFromCart, cartTotal } = useCart()
  const navigate = useNavigate()

  if (cart.length === 0) {
    return (
      <div className="empty-state">
        <div className="emoji">🛒</div>
        Your cart is empty.
        <div style={{ marginTop: 14 }}>
          <Link to="/">
            <button className="btn btn-primary">Browse medicines</button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="section-title">Your cart</div>
      <div className="card" style={{ padding: '4px 14px' }}>
        {cart.map(item => (
          <div className="cart-line" key={item.medicine_id}>
            <div className="info">
              <div className="name">
                {item.name} {item.requires_rx && <span className="rx-tag">Rx</span>}
              </div>
              <div className="unit">₹{item.price} each</div>
            </div>
            <div className="qty-stepper">
              <button onClick={() => updateQty(item.medicine_id, -1)}>−</button>
              <span>{item.qty}</span>
              <button onClick={() => updateQty(item.medicine_id, 1)}>+</button>
            </div>
            <button
              onClick={() => removeFromCart(item.medicine_id)}
              style={{ background: 'none', border: 'none', color: '#c0392b', fontSize: 13, marginLeft: 4 }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 14, marginTop: 14 }}>
        <div className="summary-row total">
          <span>Subtotal</span>
          <span>₹{cartTotal.toFixed(0)}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>
          Delivery fee is calculated at checkout based on your area.
        </div>
      </div>

      <button
        className="btn btn-primary btn-block"
        style={{ marginTop: 16 }}
        onClick={() => navigate('/checkout')}
      >
        Proceed to checkout
      </button>
    </div>
  )
}
