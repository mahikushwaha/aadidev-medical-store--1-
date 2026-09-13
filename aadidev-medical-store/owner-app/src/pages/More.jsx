import { useEffect, useState } from 'react'
import { supabase, supabaseReady } from '../supabaseClient'
import { useAuth } from '../AuthContext'
import StoreLocationPicker from '../components/StoreLocationPicker'

export default function More() {
  const [tab, setTab] = useState('plans')
    const { signOut } = useAuth()

  return (
    <div>
      <div className="section-title">More</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[
          ['plans', 'Plan requests'],
          ['zones', 'Delivery & pricing'],
        ].map(([key, label]) => (
          <button
            key={key}
            className="btn btn-sm"
            style={{
              background: tab === key ? 'var(--blue)' : 'white',
              color: tab === key ? 'white' : 'var(--ink)',
              border: '1px solid var(--line)',
            }}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'plans' ? <PlanRequests /> : <ZoneSettings />}

            <button className="btn btn-outline btn-block" style={{ marginTop: 24 }} onClick={signOut}>
        Log out
      </button>
      
    </div>
  )
}

function PlanRequests() {
  const [requests, setRequests] = useState([])
  const [quotes, setQuotes] = useState({})

  async function load() {
    if (!supabaseReady) return
    const { data } = await supabase.from('plan_requests').select('*').order('created_at', { ascending: false })
    setRequests(data || [])
  }

  useEffect(() => {
    load()
    if (!supabaseReady) return
    const channel = supabase
      .channel('plans-owner-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plan_requests' }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function sendQuote(id) {
    const price = Number(quotes[id])
    if (!price) return
    await supabase.from('plan_requests').update({ status: 'Quoted', quoted_price: price }).eq('id', id)
  }

  async function closeRequest(id) {
    await supabase.from('plan_requests').update({ status: 'Closed' }).eq('id', id)
  }

  if (!supabaseReady) return null

  if (requests.length === 0) {
    return (
      <div className="empty-state">
        <div className="emoji">📋</div>
        No plan requests yet.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {requests.map(r => (
        <div className="card" key={r.id} style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{r.customer_name}</div>
            <span className="tag tag-ok" style={{ textTransform: 'capitalize' }}>{r.status}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '4px 0' }}>
            {r.phone} · {r.frequency}
          </div>
          <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', margin: '8px 0', background: 'var(--bg)', padding: 8, borderRadius: 8 }}>
            {r.medicine_list}
          </div>
          {r.note && <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 8 }}>Note: {r.note}</div>}

          {r.status === 'New' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                placeholder="Quote price ₹"
                value={quotes[r.id] || ''}
                onChange={e => setQuotes(q => ({ ...q, [r.id]: e.target.value }))}
                style={{ flex: 1, border: '1px solid var(--line)', borderRadius: 8, padding: '8px 10px' }}
              />
              <button className="btn btn-primary btn-sm" onClick={() => sendQuote(r.id)}>
                Send quote
              </button>
            </div>
          )}
          {r.status === 'Quoted' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700 }}>Quoted ₹{Number(r.quoted_price).toFixed(0)}</span>
              <button className="btn btn-outline btn-sm" onClick={() => closeRequest(r.id)}>
                Mark closed
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ZoneSettings() {
  const [zones, setZones] = useState([])
  const [settings, setSettings] = useState({
    free_km: 2, per_km_rate: 10, store_lat: null, store_lng: null, road_factor: 1.3,
    store_name: 'Aadidev Medical Store', store_address: '', store_phone: '',
  })
  const [newZone, setNewZone] = useState({ name: '', distance_km: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    if (!supabaseReady) return
    const [{ data: z }, { data: s }] = await Promise.all([
      supabase.from('zones').select('*').order('name'),
      supabase.from('delivery_settings').select('*').eq('id', 1).single(),
    ])
    setZones(z || [])
    if (s) setSettings(s)
  }

  useEffect(() => {
    load()
  }, [])

  async function saveSettings() {
    setSaving(true)
    await supabase
      .from('delivery_settings')
      .update({
        free_km: Number(settings.free_km),
        per_km_rate: Number(settings.per_km_rate),
        road_factor: Number(settings.road_factor) || 1.3,
      })
      .eq('id', 1)
    setSaving(false)
  }

  async function saveStoreInfo() {
    setSaving(true)
    await supabase
      .from('delivery_settings')
      .update({
        store_name: settings.store_name || 'Aadidev Medical Store',
        store_address: settings.store_address || null,
        store_phone: settings.store_phone || null,
      })
      .eq('id', 1)
    setSaving(false)
  }

  async function saveStoreLocation(lat, lng) {
    setSettings(s => ({ ...s, store_lat: lat, store_lng: lng }))
    await supabase.from('delivery_settings').update({ store_lat: lat, store_lng: lng }).eq('id', 1)
  }

  async function addZone() {
    if (!newZone.name.trim() || !newZone.distance_km) return
    await supabase.from('zones').insert({ name: newZone.name.trim(), distance_km: Number(newZone.distance_km) })
    setNewZone({ name: '', distance_km: '' })
    load()
  }

  async function deleteZone(id) {
    await supabase.from('zones').delete().eq('id', id)
    load()
  }

  if (!supabaseReady) return null

  return (
    <div>
      <div className="card" style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Store info (shown to customers)</div>
        <div className="field">
          <label>Store name</label>
          <input value={settings.store_name || ''} onChange={e => setSettings(s => ({ ...s, store_name: e.target.value }))} />
        </div>
        <div className="field">
          <label>Address</label>
          <textarea value={settings.store_address || ''} onChange={e => setSettings(s => ({ ...s, store_address: e.target.value }))} placeholder="Shop no., street, area, Satna, MP" />
        </div>
        <div className="field">
          <label>Contact phone</label>
          <input value={settings.store_phone || ''} onChange={e => setSettings(s => ({ ...s, store_phone: e.target.value }))} placeholder="10-digit number" />
        </div>
        <button className="btn btn-primary btn-block" onClick={saveStoreInfo} disabled={saving}>
          {saving ? 'Saving…' : 'Save store info'}
        </button>
      </div>

      <div className="card" style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Store location (for map-based delivery distance)</div>
        <StoreLocationPicker lat={settings.store_lat} lng={settings.store_lng} onChange={saveStoreLocation} />
        {settings.store_lat != null && (
          <div style={{ fontSize: 12, color: 'var(--green-dark)', marginTop: 8 }}>
            ✓ Saved: {Number(settings.store_lat).toFixed(5)}, {Number(settings.store_lng).toFixed(5)}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Pricing rule</div>
        <div className="field-row">
          <div className="field">
            <label>Free delivery up to (km)</label>
            <input type="number" value={settings.free_km} onChange={e => setSettings(s => ({ ...s, free_km: e.target.value }))} />
          </div>
          <div className="field">
            <label>Rate beyond that (₹/km)</label>
            <input type="number" value={settings.per_km_rate} onChange={e => setSettings(s => ({ ...s, per_km_rate: e.target.value }))} />
          </div>
        </div>
        <div className="field">
          <label>Road-distance factor</label>
          <input type="number" step="0.1" value={settings.road_factor} onChange={e => setSettings(s => ({ ...s, road_factor: e.target.value }))} />
          <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 4 }}>
            The map measures straight-line distance; this multiplies it to roughly match real road distance. 1.3 is a good starting point — raise it if customers' actual delivery fees feel too low.
          </div>
        </div>
        <button className="btn btn-primary btn-block" onClick={saveSettings} disabled={saving}>
          {saving ? 'Saving…' : 'Save pricing'}
        </button>
      </div>

      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Delivery areas (legacy list, optional)</div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginBottom: 10 }}>
        No longer used for pricing now that the map calculates real distance — kept here only if you still want a
        reference list of named localities.
      </div>
      <div className="card" style={{ padding: '4px 14px', marginBottom: 14 }}>
        {zones.length === 0 ? (
          <div className="empty-state">No areas added yet.</div>
        ) : (
          zones.map(z => (
            <div className="list-item" key={z.id}>
              <span>
                {z.name} — {z.distance_km} km
              </span>
              <button className="btn btn-danger btn-sm" onClick={() => deleteZone(z.id)}>
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div className="field-row">
          <div className="field">
            <label>Area name</label>
            <input value={newZone.name} onChange={e => setNewZone(z => ({ ...z, name: e.target.value }))} placeholder="e.g. Civil Lines" />
          </div>
          <div className="field">
            <label>Distance (km)</label>
            <input type="number" value={newZone.distance_km} onChange={e => setNewZone(z => ({ ...z, distance_km: e.target.value }))} />
          </div>
        </div>
        <button className="btn btn-primary btn-block" onClick={addZone}>
          Add area
        </button>
      </div>
    </div>
  )
}