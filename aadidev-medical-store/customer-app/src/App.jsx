import { HashRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { CartProvider, useCart } from './CartContext'
import { AuthProvider, useAuth } from './AuthContext'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import Track from './pages/Track'
import Chat from './pages/Chat'
import PlanRequest from './pages/PlanRequest'
import Login from './pages/Login'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="empty-state">Loading…</div>
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return children
}

function Shell() {
  const { toast } = useCart()
  const { user, signOut } = useAuth()
  return (
    <div className="app-shell">
      <header className="app-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Aadidev Medical Store</h1>
            <div className="tagline">Fast, trusted medicine delivery in Satna</div>
          </div>
          {user ? (
            <button onClick={signOut} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', padding: '6px 11px', borderRadius: 8, fontSize: 12 }}>
              Log out
            </button>
          ) : (
            <Link to="/login">
              <button style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', padding: '6px 11px', borderRadius: 8, fontSize: 12 }}>
                Log in
              </button>
            </Link>
          )}
        </div>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cart" element={<Cart />} />
          <Route
            path="/checkout"
            element={
              <RequireAuth>
                <Checkout />
              </RequireAuth>
            }
          />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route
            path="/track"
            element={
              <RequireAuth>
                <Track />
              </RequireAuth>
            }
          />
          <Route
            path="/chat"
            element={
              <RequireAuth>
                <Chat />
              </RequireAuth>
            }
          />
          <Route
            path="/plan"
            element={
              <RequireAuth>
                <PlanRequest />
              </RequireAuth>
            }
          />
        </Routes>
      </main>
      <BottomNav />
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <HashRouter>
          <Shell />
        </HashRouter>
      </CartProvider>
    </AuthProvider>
  )
}
