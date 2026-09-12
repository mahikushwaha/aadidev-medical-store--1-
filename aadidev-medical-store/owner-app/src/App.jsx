import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import { supabase, supabaseReady } from './supabaseClient'
import PinLogin from './pages/PinLogin'
import Dashboard from './pages/Dashboard'
import Medicines from './pages/Medicines'
import Orders from './pages/Orders'
import Chats from './pages/Chats'
import More from './pages/More'
import OwnerNav from './components/OwnerNav'

function Shell() {
  const { lock } = useAuth()
  const [pendingOrders, setPendingOrders] = useState(0)
  const [newPlans, setNewPlans] = useState(0)

  useEffect(() => {
    if (!supabaseReady) return
    async function loadCounts() {
      const [{ data: orders }, { data: plans }] = await Promise.all([
        supabase.from('orders').select('status').eq('status', 'Pending'),
        supabase.from('plan_requests').select('status').eq('status', 'New'),
      ])
      setPendingOrders((orders || []).length)
      setNewPlans((plans || []).length)
    }
    loadCounts()
    const channel = supabase
      .channel('shell-counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plan_requests' }, loadCounts)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  return (
    <div className="owner-shell">
      <header className="owner-header">
        <div>
          <div className="title">Aadidev Medical Store</div>
          <div className="sub">Owner console</div>
        </div>
        <button onClick={lock}>Lock</button>
      </header>
      <main className="owner-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/medicines" element={<Medicines />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/chats" element={<Chats />} />
          <Route path="/more" element={<More />} />
        </Routes>
      </main>
      <OwnerNav pendingOrders={pendingOrders} newPlans={newPlans} />
    </div>
  )
}

function Gate() {
  const { unlocked } = useAuth()
  return unlocked ? <Shell /> : <PinLogin />
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Gate />
      </HashRouter>
    </AuthProvider>
  )
}
