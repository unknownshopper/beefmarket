import { useEffect, useMemo, useState } from 'react'
import CategoryGrid from '../components/CategoryGrid'
import ProductSlides from '../components/ProductSlides'
import CartDrawer from '../components/CartDrawer'
import Header from '../components/Header'
import SEO from '../components/SEO'
import { BUSINESS, CATEGORIES, PRODUCTS } from '../catalog'
import { loadCart, saveCart } from '../lib/storage'

function indexProducts(productsByCategory) {
  const m = new Map()
  Object.values(productsByCategory).forEach((arr) => {
    arr.forEach((p) => m.set(p.id, p))
  })
  return m
}

function countItems(cart) {
  return Object.values(cart).reduce((acc, n) => acc + n, 0)
}

export default function Productos() {
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [cart, setCart] = useState(() => (typeof window === 'undefined' ? {} : loadCart()))

  useEffect(() => {
    saveCart(cart)
  }, [cart])

  const productsIndex = useMemo(() => indexProducts(PRODUCTS), [])
  const shopCategories = useMemo(() => CATEGORIES.filter((c) => c.id !== 'eventos'), [])

  const selectedCategory = shopCategories.find((c) => c.id === selectedCategoryId) || null
  const products = selectedCategoryId ? PRODUCTS[selectedCategoryId] || [] : []

  function inc(productId) {
    setCart((prev) => {
      const next = { ...prev }
      next[productId] = (next[productId] || 0) + 1
      return next
    })
  }

  function dec(productId) {
    setCart((prev) => {
      const current = prev[productId] || 0
      if (current <= 0) return prev
      const next = { ...prev }
      const updated = current - 1
      if (updated <= 0) delete next[productId]
      else next[productId] = updated
      return next
    })
  }

  const totalItems = countItems(cart)

  const cartButton = (
    <button
      onClick={() => setCartOpen(true)}
      className="rounded-2xl border border-beef-line bg-black/20 px-3 py-2 text-sm"
    >
      Carrito{totalItems ? ` (${totalItems})` : ''}
    </button>
  )

  return (
    <div className="min-h-dvh bg-beef-bg">
      <SEO
        title="Productos en línea | BEEF MARKET"
        description="Catálogo de cortes premium, quesos, embutidos y más. Arma tu pedido y cotiza por WhatsApp."
        url="/productos"
        type="product"
      />
      <Header right={cartButton} />

      <main className="px-4 pt-4 pb-6 safe-bottom">
        <div className="mb-3">
          <div className="text-lg font-semibold">Productos en línea</div>
          <div className="mt-1 text-sm text-white/70">Toca una categoría para ver productos en modo slides.</div>
        </div>

        <CategoryGrid categories={shopCategories} onSelect={(id) => setSelectedCategoryId(id)} />

        <div className="mt-4 rounded-2xl border border-beef-line bg-black/20 p-3 text-xs text-white/70">
          Cotización: los precios se confirman al momento por WhatsApp.
        </div>
      </main>

      {selectedCategory ? (
        <ProductSlides
          products={products}
          cart={cart}
          onInc={(id) => inc(id)}
          onDec={(id) => dec(id)}
          onBack={() => setSelectedCategoryId(null)}
          onOpenCart={() => setCartOpen(true)}
          categoryName={selectedCategory.name}
        />
      ) : null}

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        productsIndex={productsIndex}
        onInc={(id) => inc(id)}
        onDec={(id) => dec(id)}
        selectedCategoryName={selectedCategory?.name || null}
      />
    </div>
  )
}
