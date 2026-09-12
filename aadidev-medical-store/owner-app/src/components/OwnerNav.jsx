import { NavLink } from 'react-router-dom'

export default function OwnerNav({ pendingOrders = 0, newPlans = 0 }) {
  return (
    <nav className="owner-nav">
      <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="icon">🏠</span>
        Home
      </NavLink>
      <NavLink to="/medicines" className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="icon">💊</span>
        Stock
      </NavLink>
      <NavLink to="/orders" className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="icon">📦</span>
        {pendingOrders > 0 && <span className="badge-dot">{pendingOrders}</span>}
        Orders
      </NavLink>
      <NavLink to="/chats" className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="icon">💬</span>
        Chats
      </NavLink>
      <NavLink to="/more" className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="icon">⚙️</span>
        {newPlans > 0 && <span className="badge-dot">{newPlans}</span>}
        More
      </NavLink>
    </nav>
  )
}
