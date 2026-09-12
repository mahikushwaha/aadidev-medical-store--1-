import { NavLink } from 'react-router-dom'
import { useCart } from '../CartContext'

export default function BottomNav() {
  const { cartCount } = useCart()
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="icon">🏠</span>
        Home
      </NavLink>
      <NavLink to="/cart" className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="icon">🛒</span>
        {cartCount > 0 && <span className="badge-dot">{cartCount}</span>}
        Cart
      </NavLink>
      <NavLink to="/track" className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="icon">📦</span>
        Track
      </NavLink>
      <NavLink to="/chat" className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="icon">💬</span>
        Chat
      </NavLink>
      <NavLink to="/plan" className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="icon">📋</span>
        Plan
      </NavLink>
    </nav>
  )
}
