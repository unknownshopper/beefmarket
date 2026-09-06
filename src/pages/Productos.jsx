import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import SEO from '../components/SEO'
import MapPicker from '../components/MapPicker'
import { BUSINESS, OLIVE_ITEMS, TABLES } from '../catalog'
import { buildWhatsAppUrl } from '../lib/whatsapp'
import { formatMXN } from '../lib/money'
import { toE164 } from '../lib/clients'
import { saveQuote } from '../lib/quotes'
import {
  BUSINESS_COORDS,
  calculateTransportCost,
  haversineDistance,
} from '../lib/inventory'

function countItems(cart) {
  return Object.values(cart).reduce((a, b) => a + b, 0)
}

export default function Productos() {
  const [cart, setCart] = useState({})
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [mode, setMode] = useState('pickup')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [pin, setPin] = useState(null)
  const [routeDistanceKm, setRouteDistanceKm] = useState(null)
  const [mapAddress, setMapAddress] = useState(null)
  const printRef = useRef(null)
  const savedRef = useRef(false)

  useEffect(() => {
    savedRef.current = false
  }, [cart, clientName, clientPhone, mode, deliveryAddress, pin])

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

  const straightDistanceKm = useMemo(
    () => (pin ? haversineDistance(BUSINESS_COORDS, pin) : 0),
    [pin]
  )
  const distanceKm = routeDistanceKm !== null ? routeDistanceKm : straightDistanceKm
  const transportCost =
    mode === 'pickup' ? 0 : pin ? calculateTransportCost(distanceKm) : 0

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
    `Entrega: ${mode === 'pickup' ? 'Recoger en tienda' : deliveryAddress || 'Sin dirección'}`,
    mode === 'pickup'
      ? 'Traslado: No aplica (recoger en tienda)'
      : pin
        ? `Traslado: ${distanceKm.toFixed(1)} km · ${formatMXN(transportCost)}`
        : 'Traslado: Sin ubicación',
    pin
      ? `Ubicación: https://www.google.com/maps?q=${pin.lat.toFixed(5)},${pin.lng.toFixed(5)}`
      : '',
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

  async function saveOrder() {
    if (!order.items.length || !clientName || savedRef.current) return
    savedRef.current = true
    try {
      await saveQuote({
        clientName,
        clientPhone,
        clientPhoneE164: toE164(clientPhone),
        date: '',
        people: order.items.reduce((s, i) => s + (i.serves || 0) * i.qty, 0),
        serviceType: 'tablas',
        serviceLabel: 'Pedido de tablas Olive',
        pin,
        clientMapsLink: deliveryAddress.startsWith('http') ? deliveryAddress : '',
        address: mode === 'delivery' ? deliveryAddress : '',
        distanceKm,
        transportCost,
        foodCost: order.tableCost,
        serviceCost: 0,
        personnelCost: 0,
        personnelCount: 0,
        total: order.total,
        details: order.items.map((i) => ({
          name: i.name,
          qty: i.qty,
          serves: i.serves || 0,
          unitPrice: i.price || 0,
          lineTotal: i.subtotal,
        })),
      })
    } catch (err) {
      savedRef.current = false
      console.error('Error guardando pedido:', err)
    }
  }

  return (
    <div className="min-h-dvh bg-beef-bg">
      <SEO
        title="Olive by BEEF MARKET | Tablas de carnes y quesos"
        description="Tablas de carnes y quesos listas para pedir por WhatsApp."
        url="/productos"
        type="product"
      />

      <div className="print:hidden">
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
                  className="overflow-hidden rounded-3xl border border-beef-line bg-beef-card p-4 text-left"
                >
                  <div className="text-lg font-semibold">{t.name}</div>
                  <p className="mt-1 text-sm text-white/70">{t.description}</p>
                  <div className="mt-2 inline-block rounded-full border border-beef-line bg-black/20 px-3 py-1 text-xs text-white/70">
                    Para {t.servings} personas
                  </div>
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
                <label className="mb-1 block text-sm font-medium text-white/80">Tipo de entrega</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('pickup')}
                    className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold ${
                      mode === 'pickup'
                        ? 'bg-beef-accent text-black'
                        : 'border border-beef-line bg-black/20 text-white'
                    }`}
                  >
                    Recoger en tienda
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('delivery')}
                    className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold ${
                      mode === 'delivery'
                        ? 'bg-beef-accent text-black'
                        : 'border border-beef-line bg-black/20 text-white'
                    }`}
                  >
                    A domicilio
                  </button>
                </div>
              </div>

              {mode === 'delivery' ? (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-white/80">
                      Dirección de entrega
                    </label>
                    <MapPicker
                      business={BUSINESS_COORDS}
                      pin={pin}
                      onChange={setPin}
                      onDistance={setRouteDistanceKm}
                      onAddress={(data) => {
                        setMapAddress(data)
                        if (data) {
                          setDeliveryAddress(
                            [
                              data.address?.house_number,
                              data.address?.road,
                              data.address?.suburb,
                              data.address?.city ||
                                data.address?.town ||
                                data.address?.village,
                              data.address?.state,
                              data.address?.postcode,
                            ]
                              .filter(Boolean)
                              .join(', ')
                          )
                        }
                      }}
                      onMapsLink={(link) => {
                        setPin(null)
                        setRouteDistanceKm(null)
                        setMapAddress(null)
                        setDeliveryAddress(link)
                      }}
                    />
                  </div>
                </>
              ) : null}

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
                onClick={saveOrder}
                className={`flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold text-black ${
                  clientName ? 'bg-beef-accent' : 'bg-beef-accent/50 pointer-events-none'
                }`}
              >
                Enviar pedido por WhatsApp ({countItems(cart)} tablas)
              </a>

              <button
                onClick={() => {
                  saveOrder()
                  window.print()
                }}
                className="flex w-full items-center justify-center rounded-2xl border border-beef-line bg-black/20 px-4 py-3 text-sm font-semibold text-white"
              >
                Generar PDF
              </button>

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

      <div
        ref={printRef}
        className="hidden print:block w-[210mm] min-h-[297mm] bg-white p-8 text-sm text-black"
        style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
      >
        <div className="border-b-2 border-amber-500 pb-4 mb-6">
          <div className="text-2xl font-extrabold tracking-wide">OLIVE by BEEF MARKET</div>
          <div className="text-gray-600">Charcutería & Quesos</div>
          <div className="text-gray-600">{BUSINESS.addressShort}</div>
          <div className="text-gray-600">{BUSINESS.displayPhone}</div>
        </div>

        <h2 className="text-xl font-bold mb-4">Cotización de mesa de charcutería</h2>

        <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold text-gray-700">Cliente:</span> {clientName || 'Sin nombre'}
          </div>
          <div>
            <span className="font-semibold text-gray-700">Teléfono:</span> {clientPhone || 'Sin teléfono'}
          </div>
          <div>
            <span className="font-semibold text-gray-700">Fecha:</span>{' '}
            {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </div>
          <div className="col-span-2">
            <span className="font-semibold text-gray-700">Entrega:</span>{' '}
            {mode === 'pickup' ? 'Recoger en tienda' : deliveryAddress || 'Sin dirección'}
          </div>
        </div>

        <table className="w-full border-collapse text-sm mb-6">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="py-2 text-left">Concepto</th>
              <th className="py-2 text-left">Cantidad</th>
              <th className="py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id} className="border-b border-gray-100">
                <td className="py-2">{i.name} ({i.servings} personas)</td>
                <td className="py-2">{i.qty}</td>
                <td className="py-2 text-right">{formatMXN(i.subtotal)}</td>
              </tr>
            ))}
            {transportCost > 0 ? (
              <tr className="border-b border-gray-100">
                <td className="py-2">Traslado</td>
                <td className="py-2">-</td>
                <td className="py-2 text-right">{formatMXN(transportCost)}</td>
              </tr>
            ) : null}
          </tbody>
        </table>

        <div className="mb-2 flex justify-between text-gray-700">
          <span>Tablas</span>
          <span>{formatMXN(order.tableCost)}</span>
        </div>
        <div className="mb-2 flex justify-between text-gray-700">
          <span>Traslado</span>
          <span>{formatMXN(transportCost)}</span>
        </div>
        <div className="mt-4 flex justify-between border-t-2 border-gray-200 pt-3 text-lg font-bold">
          <span>Total estimado</span>
          <span>{formatMXN(order.total)}</span>
        </div>

        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="font-semibold text-gray-700">Ingredientes incluidos:</div>
          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
            {OLIVE_ITEMS.map((item, idx) => (
              <li key={idx}>• {item}</li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Esperamos el comprobante de su transferencia del 50% a la cuenta XXX XXX XXXXX del banco XXXX para apartar su fecha. Saludos
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Los precios no incluyen IVA. Precio final sujeto a confirmación.
        </p>
      </div>
    </div>
  )
}
