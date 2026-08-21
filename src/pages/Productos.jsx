import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import SEO from '../components/SEO'
import { BUSINESS, TABLES } from '../catalog'
import { buildWhatsAppUrl } from '../lib/whatsapp'
import { formatMXN } from '../lib/money'
import { ZONES } from '../lib/inventory'

function countItems(cart) {
  return Object.values(cart).reduce((a, b) => a + b, 0)
}

export default function Productos() {
  const [cart, setCart] = useState({})
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [mapsLink, setMapsLink] = useState('')
  const [zoneId, setZoneId] = useState('local')
  const [customCost, setCustomCost] = useState(0)

  function inc(id) {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }))
  }

  function dec(id) {
    setCart((prev) => {
      const next = { ...prev }
      const current = next[id] || 0
      if (current <= 1) delete next[id]
      else next[id] = current - 1
      return next
    })
  }

  const selectedZone = ZONES.find((z) => z.id === zoneId)
  const transportCost = zoneId === 'custom' ? Number(customCost || 0) : selectedZone?.cost || 0
  const distanceKm = zoneId === 'custom' ? 0 : selectedZone?.distanceKm || 0

  const order = useMemo(() => {
    const items = Object.entries(cart)
      .map(([id, qty]) => {
        const t = TABLES.find((x) => x.id === id)
        if (!t) return null
        return { ...t, qty, subtotal: (t.price || 0) * qty }
      })
      .filter(Boolean)
    const tableCost = items.reduce((sum, i) => sum + i.subtotal, 0)
    return { items, tableCost, total: tableCost + transportCost }
  }, [cart, transportCost])

  const messageLines = [
    `Hola, quiero ordenar tablas de Olive by BEEF MARKET.`,
    `Cliente: ${clientName || 'Sin nombre'}`,
    `Teléfono: ${clientPhone || 'Sin teléfono'}`,
    `Ubicación: ${mapsLink || 'Sin ubicación'}`,
    zoneId === 'custom'
      ? `Traslado (otro): a confirmar`
      : `Traslado: ${selectedZone?.name} (${distanceKm} km) · ${formatMXN(transportCost)}`,
    '',
    'Mi pedido:',
    ...order.items.map((i) => `- ${i.qty} x ${i.name}: ${formatMXN(i.subtotal)}`),
    '',
    `Tablas: ${formatMXN(order.tableCost)}`,
    `Traslado: ${formatMXN(transportCost)}`,
    `Total estimado: ${formatMXN(order.total)}`,
    '',
    '¿Me confirman precio, disponibilidad y horario de entrega?',
  ]

  const waUrl =
    order.items.length && clientName
      ? buildWhatsAppUrl(BUSINESS.phoneE164, messageLines.join('\n'))
      : '#'

  function openMaps() {
    window.open('https://www.google.com/maps', '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="min-h-dvh bg-beef-bg">
      <SEO
        title="Olive by BEEF MARKET | Tablas de carnes y quesos"
        description="Tablas de carnes y quesos listas para pedir por WhatsApp."
        url="/productos"
        type="product"
      />
      <Header />

      <main className="px-4 pt-4 pb-6 safe-bottom">
        <div className="mb-6 text-center">
          <div className="text-sm font-semibold tracking-wider text-beef-accent">OLIVE BY</div>
          <h1 className="text-2xl font-bold tracking-wide">BEEF MARKET</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/70">
            Tablas de carnes y quesos con sus accesorios. Selecciona la cantidad de cada tabla y envía el pedido por WhatsApp.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {TABLES.map((t) => {
            const qty = cart[t.id] || 0
            return (
              <div
                key={t.id}
                className="overflow-hidden rounded-3xl border border-beef-line bg-beef-card text-left"
              >
                <div className="aspect-[4/3] w-full overflow-hidden">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-4">
                  <div className="text-lg font-semibold">{t.name}</div>
                  <p className="mt-1 text-sm text-white/70">{t.description}</p>
                  <ul className="mt-2 space-y-1 text-xs text-white/50">
                    {t.items.map((item, i) => (
                      <li key={i}>· {item}</li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm font-medium text-beef-accent">
                      {formatMXN(t.price || 0)} c/u
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => dec(t.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-beef-line bg-black/20 text-white"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                      <button
                        onClick={() => inc(t.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-beef-accent text-black"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {order.items.length > 0 ? (
          <div className="mt-6 space-y-4 rounded-3xl border border-beef-line bg-beef-card p-4">
            <div className="text-base font-semibold">Tu pedido · Olive by BEEF MARKET</div>

            <ul className="space-y-2 text-sm text-white/80">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center justify-between">
                  <span>
                    {i.qty} x {i.name}
                  </span>
                  <span className="font-medium">{formatMXN(i.subtotal)}</span>
                </li>
              ))}
            </ul>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Tu nombre</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full rounded-2xl border border-beef-line bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-beef-accent"
                placeholder="Ej. Nora Reséndiz"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Tu teléfono</label>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full rounded-2xl border border-beef-line bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-beef-accent"
                placeholder="993 000 0000"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Zona de entrega</label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="w-full rounded-2xl border border-beef-line bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-beef-accent"
              >
                {ZONES.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} — {z.distanceKm} km — {formatMXN(z.cost)}
                  </option>
                ))}
                <option value="custom">Otra ubicación</option>
              </select>
              {zoneId === 'custom' ? (
                <input
                  type="number"
                  min={0}
                  step="1"
                  value={customCost}
                  onChange={(e) => setCustomCost(Number(e.target.value))}
                  className="mt-2 w-full rounded-2xl border border-beef-line bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-beef-accent"
                  placeholder="Costo de traslado"
                />
              ) : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Ubicación de entrega</label>
              <p className="mb-2 text-xs text-white/60">
                Abre Google Maps, selecciona tu ubicación, copia el enlace y pégalo aquí.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={mapsLink}
                  onChange={(e) => setMapsLink(e.target.value)}
                  className="w-full rounded-2xl border border-beef-line bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-beef-accent"
                  placeholder="https://maps.app.goo.gl/..."
                />
                <button
                  type="button"
                  onClick={openMaps}
                  className="shrink-0 rounded-2xl border border-beef-line bg-black/20 px-4 py-3 text-sm font-medium text-white"
                >
                  Maps
                </button>
              </div>
            </div>

            <div className="space-y-1 border-t border-beef-line pt-3 text-sm">
              <div className="flex justify-between text-white/70">
                <span>Tablas</span>
                <span>{formatMXN(order.tableCost)}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Traslado</span>
                <span>{formatMXN(transportCost)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-white">
                <span>Total estimado</span>
                <span>{formatMXN(order.total)}</span>
              </div>
            </div>

            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className={`flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold text-black ${
                clientName && mapsLink ? 'bg-beef-accent' : 'bg-beef-accent/50 pointer-events-none'
              }`}
            >
              Enviar pedido por WhatsApp ({countItems(cart)} tablas)
            </a>
            <div className="text-center text-xs text-white/50">
              Nora te confirmará precio, disponibilidad, horario de entrega y costo final.
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-beef-line bg-beef-card p-4 text-center text-sm text-white/60">
            Toca el + en las tablas para comenzar tu pedido.
          </div>
        )}

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-white/60 hover:text-white">
            Volver al inicio
          </Link>
        </div>
      </main>
    </div>
  )
}
