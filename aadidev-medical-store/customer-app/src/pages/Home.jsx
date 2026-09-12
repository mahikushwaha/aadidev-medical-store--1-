import { useEffect, useState, useMemo } from 'react'
import { supabase, supabaseReady } from '../supabaseClient'
import { useCart } from '../CartContext'
import { DEMO_MEDICINES } from '../demoData'

export default function Home() {
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const { addToCart } = useCart()

  useEffect(() => {
    let channel
    async function load() {
      if (!supabaseReady) {
        setMedicines(DEMO_MEDICINES)
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .order('name')
      if (!error) setMedicines(data || [])
      setLoading(false)

      channel = supabase
        .channel('medicines-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'medicines' }, () => {
          load()
        })
        .subscribe()
    }
    load()
    return () => {
      if (channel) supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const categories = useMemo(() => {
    const set = new Set(medicines.map(m => m.category))
    return ['All', ...Array.from(set)]
  }, [medicines])

  const filtered = medicines.filter(m => {
    const matchesQuery = m.name.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = category === 'All' || m.category === category
    return matchesQuery && matchesCategory
  })

  return (
    <div>
      {!supabaseReady && (
        <div className="setup-banner">
          Showing sample medicines. Connect Supabase (see README) to go live with real stock.
        </div>
      )}

      <div className="search-bar">
        <span>🔍</span>
        <input
          placeholder="Search medicines..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      <div className="pill-row">
        {categories.map(c => (
          <button
            key={c}
            className={`pill ${category === c ? 'active' : ''}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state">Loading medicines…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="emoji">💊</div>
          No medicines found. Try a different search.
        </div>
      ) : (
        <div className="med-grid">
          {filtered.map(m => (
            <MedicineCard key={m.id} medicine={m} onAdd={() => addToCart(m)} />
          ))}
        </div>
      )}
    </div>
  )
}

function MedicineCard({ medicine, onAdd }) {
  const outOfStock = medicine.stock <= 0
  return (
    <div className="med-card">
      <div className="cat">{medicine.category}</div>
      <div className="name">{medicine.name}</div>
      {medicine.requires_rx && <span className="rx-tag">Rx required</span>}
      {medicine.stock > 0 && medicine.stock <= 5 && (
        <span className="stock-low">Only {medicine.stock} left</span>
      )}
      <div className="price-row">
        <span className="price">₹{Number(medicine.price).toFixed(0)}</span>
        <button className="btn btn-primary" disabled={outOfStock} onClick={onAdd}>
          {outOfStock ? 'Out of stock' : 'Add'}
        </button>
      </div>
    </div>
  )
}
