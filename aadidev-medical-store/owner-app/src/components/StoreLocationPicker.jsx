import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

export default function StoreLocationPicker({ lat, lng, onChange }) {
  const [position, setPosition] = useState(
    lat != null && lng != null ? { lat, lng } : SATNA_DEFAULT
  )

  useEffect(() => {
    if (lat != null && lng != null) setPosition({ lat, lng })
  }, [lat, lng])

  function pick(newLat, newLng) {
    setPosition({ lat: newLat, lng: newLng })
    onChange(newLat, newLng)
  }

  function useMyLocation() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(pos => {
      pick(pos.coords.latitude, pos.coords.longitude)
    })
  }

  return (
    <div>
      <button className="btn btn-outline btn-block" style={{ marginBottom: 8 }} onClick={useMyLocation}>
        📍 Use my current location (stand at the shop)
      </button>
      <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line)', marginBottom: 6 }}>
        <MapContainer center={[position.lat, position.lng]} zoom={14} style={{ height: 220, width: '100%' }}>
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker
            position={[position.lat, position.lng]}
            icon={markerIcon}
            draggable
            eventHandlers={{
              dragend: e => {
                const { lat: newLat, lng: newLng } = e.target.getLatLng()
                pick(newLat, newLng)
              },
            }}
          />
          <ClickHandler onPick={pick} />
        </MapContainer>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>
        Tap the map or drag the pin to mark your store's exact location. This is the point every delivery distance is calculated from.
      </div>
    </div>
  )
}
