import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icons (Vite doesn't bundle Leaflet's default image paths)
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

const SATNA_DEFAULT = { lat: 24.5854, lng: 80.8322 }

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function LocationPicker({ value, onChange }) {
  const [position, setPosition] = useState(value || SATNA_DEFAULT)
  const [address, setAddress] = useState(value?.address || '')
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    if (value?.lat && value?.lng) setPosition(value)
  }, [value?.lat, value?.lng])

  async function reverseGeocode(lat, lng) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      )
      const data = await res.json()
      const label = data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      setAddress(label)
      onChange({ lat, lng, address: label })
    } catch {
      const label = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      setAddress(label)
      onChange({ lat, lng, address: label })
    }
  }

  function pick(lat, lng) {
    setPosition({ lat, lng })
    reverseGeocode(lat, lng)
  }

  async function search() {
    if (!query.trim()) return
    setSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query + ', Satna, Madhya Pradesh')}`
      )
      const data = await res.json()
      setSuggestions(data || [])
    } finally {
      setSearching(false)
    }
  }

  function chooseSuggestion(s) {
    const lat = parseFloat(s.lat)
    const lng = parseFloat(s.lon)
    setSuggestions([])
    setQuery('')
    setPosition({ lat, lng })
    setAddress(s.display_name)
    onChange({ lat, lng, address: s.display_name })
  }

  function useMyLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocating(false)
        pick(pos.coords.latitude, pos.coords.longitude)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search your locality (e.g. Civil Lines)"
          onKeyDown={e => e.key === 'Enter' && search()}
          style={{ flex: 1, border: '1px solid var(--line)', borderRadius: 9, padding: '10px 12px' }}
        />
        <button className="btn btn-outline" onClick={search} disabled={searching}>
          {searching ? '…' : 'Search'}
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="card" style={{ marginBottom: 8, maxHeight: 160, overflowY: 'auto' }}>
          {suggestions.map((s, idx) => (
            <div
              key={idx}
              onClick={() => chooseSuggestion(s)}
              style={{ padding: '8px 12px', fontSize: 12.5, borderBottom: idx < suggestions.length - 1 ? '1px solid var(--line)' : 'none', cursor: 'pointer' }}
            >
              {s.display_name}
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-outline btn-block" style={{ marginBottom: 8 }} onClick={useMyLocation} disabled={locating}>
        {locating ? 'Locating…' : '📍 Use my current location'}
      </button>

      <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line)', marginBottom: 8 }}>
        <MapContainer center={[position.lat, position.lng]} zoom={14} style={{ height: 220, width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            position={[position.lat, position.lng]}
            icon={markerIcon}
            draggable
            eventHandlers={{
              dragend: e => {
                const { lat, lng } = e.target.getLatLng()
                pick(lat, lng)
              },
            }}
          />
          <ClickHandler onPick={pick} />
        </MapContainer>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>
        Tap the map or drag the pin to set your exact delivery spot.
      </div>
      {address && (
        <div style={{ fontSize: 12.5, marginTop: 6, background: 'var(--bg)', padding: 8, borderRadius: 8 }}>
          📍 {address}
        </div>
      )}
    </div>
  )
}
