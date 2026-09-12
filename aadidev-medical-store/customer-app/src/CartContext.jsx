import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)

function loadPhone() {
  return localStorage.getItem('aadidev_phone') || ''
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const raw = sessionStorage.getItem('aadidev_cart')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [customerPhone, setCustomerPhone] = useState(loadPhone)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    sessionStorage.setItem('aadidev_cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    if (customerPhone) localStorage.setItem('aadidev_phone', customerPhone)
  }, [customerPhone])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 1800)
  }

  function addToCart(medicine) {
    setCart(prev => {
      const existing = prev.find(i => i.medicine_id === medicine.id)
      if (existing) {
        return prev.map(i =>
          i.medicine_id === medicine.id ? { ...i, qty: i.qty + 1 } : i
        )
      }
      return [
        ...prev,
        {
          medicine_id: medicine.id,
          name: medicine.name,
          price: medicine.price,
          requires_rx: medicine.requires_rx,
          qty: 1,
        },
      ]
    })
    showToast(`Added ${medicine.name}`)
  }

  function updateQty(medicineId, delta) {
    setCart(prev =>
      prev
        .map(i => (i.medicine_id === medicineId ? { ...i, qty: i.qty + delta } : i))
        .filter(i => i.qty > 0)
    )
  }

  function removeFromCart(medicineId) {
    setCart(prev => prev.filter(i => i.medicine_id !== medicineId))
  }

  function clearCart() {
    setCart([])
  }

  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0)
  const cartTotal = cart.reduce((sum, i) => sum + i.qty * i.price, 0)
  const hasRxItem = cart.some(i => i.requires_rx)

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
        cartCount,
        cartTotal,
        hasRxItem,
        customerPhone,
        setCustomerPhone,
        toast,
        showToast,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
