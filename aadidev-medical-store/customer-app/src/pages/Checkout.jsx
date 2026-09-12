import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase, supabaseReady } from '../supabaseClient'
import { useCart } from '../CartContext'
import { useAuth } from '../AuthContext'
import { DEMO_DELIVERY_SETTINGS } from '../demoData'
import LocationPicker from '../components/LocationPicker'
import { haversineKm } from '../utils/distance'

function genOrderNumber() {
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `AMS-${Date.now().toString().slice(-6)}${rand}`
}

export default function Checkout() {
  const { cart, cartTotal, hasRxItem, clearCart, customerPhone, setCustomerPhone } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [settings, setSettings] = useState(DEMO_DELIVERY_SETTINGS)
  const [location, setLocation] = useState(null) // { lat, lng, address }
  const [name, setName] = useState('')
  const [phone, setPhone] = useState(customerPhone || '')
  const [houseDetails, setHouseDetails] = useState('')
  const [rxConfirmed, setRxConfirmed] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function load() {
      if (!supabaseReady) {
        setSettings(DEMO_DELIVERY_SETTINGS)
        return
      }
      const { data: s } = await supabase.from('delivery_settings').select('*').eq('id', 1).single()
      if (s) setSettings(s)
    }
    load()
  }, [])

  const hasStoreLocation = settings.store_lat != null && settings.store_lng != null
  const distanceKm =
    location && hasStoreLocation
      ? haversineKm(settings.store_lat, settings.store_lng, location.lat, location.lng) * (settings.road_factor || 1.3)
      : null

  const deliveryFee =
    distanceKm != null
      ? distanceKm <= settings.free_km
        ? 0
        : Math.round((distanceKm - settings.free_km) * settings.per_km_rate)
      : 0
  const total = cartTotal + deliveryFee

  const canPlace =
    name.trim() &&
    phone.trim().length >= 10 &&
    location &&
    (!hasRxItem || rxConfirmed) &&
    !placing

  async function placeOrder() {
    if (!canPlace) return
    setPlacing(true)
    setErrorMsg('')
    const orderNumber = genOrderNumber()
    const fullAddress = houseDetails.trim() ? `${houseDetails.trim()}, ${location.address}` : location.address
    const orderRow = {
      order_number: orderNumber,
      customer_name: name.trim(),
      phone: phone.trim(),
      address: fullAddress,
      distance_km: distanceKm ? Number(distanceKm.toFixed(2)) : null,
      delivery_lat: location.lat,
      delivery_lng: location.lng,
      user_id: user?.id || null,
      items: cart.map(i => ({
        medicine_id: i.medicine_id,
        name: i.name,
        price: i.price,
        qty: i.qty,
      })),
      subtotal: cartTotal,
      delivery_fee: deliveryFee,
      total,
      status: 'Pending',
      rx_confirmed: hasRxItem ? rxConfirmed : false,
    }

    if (supabaseReady) {
      const { error } = await supabase.from('orders').insert(orderRow)
      if (error) {
        setErrorMsg('Could not place order. Please try again.')
        setPlacing(false)
        return
      }
    }

    setCustomerPhone(phone.trim())
    clearCart()
    setPlacing(false)
    navigate('/order-success', { state: { orderNumber } })
  }

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
      <Link to="/cart" className="back-link">‹ Back to cart</Link>
      <div className="section-title">Delivery details</div>

      <div className="field">
        <label>Full name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
      </div>
      <div className="field">
        <label>Phone number</label>
        <input
          value={phone}
          onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="10-digit mobile number"
          inputMode="numeric"
          maxLength={10}
        />
      </div>
      <div className="field">
        <label>House / flat no., landmark (optional)</label>
        <input value={houseDetails} onChange={e => setHouseDetails(e.target.value)} placeholder="e.g. House 12, near Shiv Mandir" />
      </div>

      <div className="field">
        <label>Delivery location</label>
        {!hasStoreLocation && supabaseReady && (
          <div className="setup-banner">
            The owner hasn't set the store's location yet, so delivery fee can't be calculated — pick your spot anyway, the owner will confirm the fee.
          </div>
        )}
        <LocationPicker value={location} onChange={setLocation} />
      </div>

      {hasRxItem && (
        <label className="checkbox-row">
          <input type="checkbox" checked={rxConfirmed} onChange={e => setRxConfirmed(e.target.checked)} />
          <span>
            My cart has a prescription-only medicine. I confirm I have a valid prescription for it, and our
            pharmacist will verify it before dispatch.
          </span>
        </label>
      )}

      <div className="card" style={{ padding: 14, marginTop: 4, marginBottom: 16 }}>
        <div className="summary-row">
          <span>Subtotal</span>
          <span>₹{cartTotal.toFixed(0)}</span>
        </div>
        <div className="summary-row">
          <span>Delivery fee {distanceKm != null && `(~${distanceKm.toFixed(1)} km)`}</span>
          <span>{location ? (deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`) : '—'}</span>
        </div>
        <div className="summary-row total">
          <span>Total</span>
          <span>₹{total.toFixed(0)}</span>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 6 }}>
          Payment: Cash on delivery
        </div>
      </div>

      {errorMsg && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 10 }}>{errorMsg}</div>}

      <button className="btn btn-primary btn-block" disabled={!canPlace} onClick={placeOrder}>
        {placing ? 'Placing order…' : `Place order · ₹${total.toFixed(0)}`}
      </button>
    </div>
  )
}
