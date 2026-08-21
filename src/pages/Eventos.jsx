import { useEffect, useMemo, useRef, useState } from 'react'
import Header from '../components/Header'
import Login from '../components/Login'
import MapPicker from '../components/MapPicker'
import SEO from '../components/SEO'
import { useAuth } from '../contexts/AuthContext'
import { BUSINESS } from '../catalog'
import { buildWhatsAppUrl } from '../lib/whatsapp'
import { formatMXN } from '../lib/money'
import { canAccessEventos, getRole } from '../lib/roles'
import {
  BUSINESS_COORDS,
  calculateEventCost,
  calculateTransportCost,
  haversineDistance,
  loadInventory,
  SERVICE_TYPES,
} from '../lib/inventory'
import { getClientByPhone, saveClient, toE164 } from '../lib/clients'
import { saveQuote } from '../lib/quotes'

export default function Eventos() {
  const { user, logout } = useAuth()
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const clientPhoneE164 = toE164(clientPhone)
  const [date, setDate] = useState('')
  const [people, setPeople] = useState(20)
  const [serviceType, setServiceType] = useState('basica')
  const [pin, setPin] = useState(null)
  const [routeDistanceKm, setRouteDistanceKm] = useState(null)
  const [address, setAddress] = useState(null)
  const [clientMapsLink, setClientMapsLink] = useState('')
  const [inventory, setInventory] = useState(() => loadInventory())
  const pdfRef = useRef(null)

  useEffect(() => {
    setInventory(loadInventory())
  }, [])

  useEffect(() => {
    if (!clientPhoneE164) return
    let active = true
    getClientByPhone(clientPhone).then((client) => {
      if (!active || !client) return
      if (client.name) setClientName(client.name)
      if (client.pin) setPin(client.pin)
      if (client.clientMapsLink) setClientMapsLink(client.clientMapsLink)
      if (client.address) setAddress(client.address)
    })
    return () => {
      active = false
    }
  }, [clientPhoneE164])

  const straightDistanceKm = useMemo(
    () => (pin ? haversineDistance(BUSINESS_COORDS, pin) : 0),
    [pin]
  )

  const distanceKm = routeDistanceKm !== null ? routeDistanceKm : straightDistanceKm
  const transportCost = pin ? calculateTransportCost(distanceKm) : 0

  const estimate = useMemo(
    () => calculateEventCost(inventory, Number(people) || 0, serviceType, transportCost),
    [inventory, people, serviceType, transportCost]
  )

  const messageLines = [
    `Hola ${clientName || 'Cliente'}, ésta es la cotización de su pedido en ${BUSINESS.name}.`,
    '',
    `Teléfono cliente: ${clientPhone || 'Sin teléfono'}`,
    `Fecha: ${date || 'Por definir'}`,
    `Personas: ${people}`,
    `Servicio: ${SERVICE_TYPES[serviceType].label}`,
    clientMapsLink
      ? `Ubicación: ${clientMapsLink}`
      : pin
        ? `Ubicación: https://www.google.com/maps?q=${pin.lat.toFixed(5)},${pin.lng.toFixed(5)}`
        : 'Ubicación: No especificada',
    address
      ? `Dirección: ${[
          address.address?.house_number,
          address.address?.road,
          address.address?.suburb,
          address.address?.city || address.address?.town || address.address?.village,
          address.address?.state,
          address.address?.postcode,
          address.address?.country,
        ].filter(Boolean).join(', ')}`
      : 'Dirección: No disponible',
    `Distancia: ${distanceKm.toFixed(1)} km`,
    '',
    'Resumen estimado:',
    ...estimate.details.map((d) => `• ${d.name}: ${d.amount.toFixed(2)} ${d.unit} (${formatMXN(d.subtotal)})`),
    ...
      estimate.personnelCount > 0
        ? [`• Asador(es) a domicilio: ${estimate.personnelCount} (${formatMXN(estimate.personnelCost)})`]
        : [],
    ...
      estimate.transportCost > 0
        ? [`• Traslado: ${distanceKm.toFixed(1)} km · ${formatMXN(estimate.transportCost)}`]
        : [],
    '',
    `Costo comida: ${formatMXN(estimate.foodCost)}`,
    `Servicio: ${formatMXN(estimate.serviceCost)}`,
    `Total estimado: ${formatMXN(estimate.total)}`,
    `Costo por persona: ${formatMXN(estimate.total / (Number(people) || 1))}`,
    '',
    'Esperamos el comprobante de su transferencia del 50% a la cuenta XXX XXX XXXXX del banco XXXX para apartar su fecha. Saludos',
    '',
    'Los precios no incluyen iva.',
  ]

  const waUrl = clientPhoneE164
    ? buildWhatsAppUrl(clientPhoneE164, messageLines.join('\n'))
    : '#'

  async function handleSend() {
    if (!clientPhoneE164 || !waUrl || waUrl === '#') return
    try {
      await saveClient({
        name: clientName,
        phone: clientPhone,
        pin,
        clientMapsLink,
        address,
      })
      await saveQuote({
        clientName,
        clientPhone,
        clientPhoneE164,
        date,
        people,
        serviceType,
        serviceLabel: SERVICE_TYPES[serviceType].label,
        pin,
        clientMapsLink,
        address,
        distanceKm,
        transportCost: estimate.transportCost,
        foodCost: estimate.foodCost,
        serviceCost: estimate.serviceCost,
        personnelCost: estimate.personnelCost,
        personnelCount: estimate.personnelCount,
        total: estimate.total,
        details: estimate.details,
      })
    } catch (err) {
      console.error('Error guardando cotización:', err)
    }
    window.open(waUrl, '_blank', 'noopener,noreferrer')
  }

  if (user === undefined) {
    return (
      <div className="min-h-dvh bg-black/70">
        <Header />
        <main className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="text-sm text-white/60">Cargando...</div>
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-dvh bg-black/70">
        <Header />
        <main className="flex min-h-[60vh] items-center justify-center px-4 pt-6 safe-bottom">
          <Login title="Acceso al cotizador" subtitle="Solo Nora o administradores." />
        </main>
      </div>
    )
  }

  const role = getRole(user.email)
  const hasAccess = canAccessEventos(role)

  return (
    <div className="min-h-dvh bg-black/70">
      <SEO
        title="Cotiza tu parrillada para eventos | BEEF MARKET"
        description="Cotiza parrilladas básicas, premium o con asador a domicilio. Selecciona fecha, personas y tipo de servicio en Villahermosa."
        url="/eventos"
        type="website"
      />
      <div className="print:hidden">
        <Header />

        <main className="px-4 pt-4 pb-6 safe-bottom">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h1 className="text-xl font-semibold">Cotiza tu parrillada</h1>
            <p className="mt-1 text-sm text-white/70">Elige el día, la ubicación, el servicio, las personas y el desglose.</p>
          </div>
          <button
            onClick={() => logout()}
            className="rounded-2xl border border-beef-line bg-black/20 px-3 py-2 text-xs font-medium text-white/80"
          >
            Cerrar sesión
          </button>
        </div>

        {!hasAccess ? (
          <div className="rounded-3xl border border-beef-line bg-beef-card p-6 text-center">
            <div className="text-lg font-semibold">Acceso restringido</div>
            <p className="mt-2 text-sm text-white/70">
              Tu rol es <strong>{role || 'desconocido'}</strong>. El cotizador es exclusivo de Nora y administradores.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="rounded-3xl border border-beef-line bg-beef-card p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-beef-accent">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-beef-accent text-xs font-bold text-black">1</span>
                  Cliente
                </div>
                <label className="mb-1 block text-sm font-medium text-white/80">Nombre del cliente</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full rounded-2xl border border-beef-line bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-beef-accent"
                  placeholder="Ej. Nora Reséndiz"
                />
                <label className="mb-1 mt-3 block text-sm font-medium text-white/80">WhatsApp del cliente</label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value.replace(/[^0-9+\s]/g, '').slice(0, 15))}
                  className="w-full rounded-2xl border border-beef-line bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-beef-accent"
                  placeholder="993 000 0000"
                />
                <p className="mt-1 text-xs text-white/50">10 dígitos o +52 seguido del número.</p>
              </div>

              <div className="rounded-3xl border border-beef-line bg-[#0d0d0f] p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-beef-accent">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-beef-accent text-xs font-bold text-black">2</span>
                  Fecha
                </div>
                <label className="mb-1 block text-sm font-medium text-white/80">Fecha del evento</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-2xl border border-beef-line bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-beef-accent"
                />
              </div>

              <div className="rounded-3xl border border-beef-line bg-beef-card p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-beef-accent">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-beef-accent text-xs font-bold text-black">3</span>
                  Ubicación
                </div>
                <p className="mb-2 text-xs text-white/60">
                  Dirección base: {BUSINESS.addressShort}. Coloca el pin en el mapa para calcular la ruta y el traslado.
                </p>
                <MapPicker
                  business={BUSINESS_COORDS}
                  pin={pin}
                  onChange={setPin}
                  onDistance={setRouteDistanceKm}
                  onAddress={setAddress}
                  onMapsLink={setClientMapsLink}
                />
                {pin ? (
                  <div className="mt-3 space-y-2 text-sm text-white/80">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <span className="text-white/60">Pin:</span>{' '}
                        {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
                      </div>
                      <div>
                        <span className="text-white/60">Distancia:</span>{' '}
                        {distanceKm.toFixed(1)} km
                        {routeDistanceKm === null ? ' (línea recta, ruta no disponible)' : ' (por ruta)'}
                      </div>
                      <div>
                        <span className="text-white/60">Costo traslado:</span>{' '}
                        {formatMXN(transportCost)}
                      </div>
                      <div>
                        <span className="text-white/60">Tarifa:</span>{' '}
                        $500 base / 3 km + $500 cada 2 km
                      </div>
                    </div>
                    {address ? (
                      <div className="rounded-2xl border border-beef-line bg-black/20 p-3">
                        <div className="text-xs text-white/60">Dirección encontrada:</div>
                        <div className="mt-1">
                          {[
                            address.address?.house_number,
                            address.address?.road,
                            address.address?.suburb,
                            address.address?.city || address.address?.town || address.address?.village,
                            address.address?.state,
                            address.address?.postcode,
                            address.address?.country,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-white/50">Obteniendo dirección...</div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="rounded-3xl border border-beef-line bg-[#0d0d0f] p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-beef-accent">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-beef-accent text-xs font-bold text-black">4</span>
                  Servicio
                </div>
                <label className="mb-2 block text-sm font-medium text-white/80">Tipo de servicio</label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {Object.entries(SERVICE_TYPES).map(([key, svc]) => {
                    const selected = serviceType === key
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setServiceType(key)}
                        className={`rounded-2xl border px-3 py-3 text-left text-sm transition-colors ${
                          selected
                            ? 'border-beef-accent bg-beef-accent text-black'
                            : 'border-beef-line bg-black/20 text-white/80 hover:bg-white/5'
                        }`}
                      >
                        <div className="font-semibold">{svc.label}</div>
                        <div className="mt-1 text-xs opacity-80 leading-snug">{svc.description}</div>
                        <div className="mt-2 text-xs font-medium opacity-90">
                          {key === 'parrillero'
                            ? `1 asador cada ${svc.personnelPer} pax · ${formatMXN(svc.personnelCost)}`
                            : svc.extraPerPerson > 0
                              ? `+ ${formatMXN(svc.extraPerPerson)} por persona`
                              : 'Sin cargo extra'}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-beef-line bg-beef-card p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-beef-accent">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-beef-accent text-xs font-bold text-black">5</span>
                  Personas
                </div>
                <label className="mb-1 block text-sm font-medium text-white/80">Número de personas</label>
                <input
                  type="number"
                  min={1}
                  value={people}
                  onChange={(e) => setPeople(Number(e.target.value))}
                  className="w-full rounded-2xl border border-beef-line bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-beef-accent"
                />
                <input
                  type="range"
                  min={5}
                  max={200}
                  step={5}
                  value={people}
                  onChange={(e) => setPeople(Number(e.target.value))}
                  className="mt-3 w-full accent-beef-accent"
                />
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-beef-line bg-[#0d0d0f] p-4">
              <h2 className="text-base font-semibold">Desglose estimado · {SERVICE_TYPES[serviceType].label}</h2>
              <ul className="mt-3 space-y-2 text-sm text-white/80">
                {estimate.details.map((d) => (
                  <li key={d.id} className="flex justify-between">
                    <span>{d.name}</span>
                    <span>
                      {d.amount.toFixed(2)} {d.unit} · {formatMXN(d.subtotal)}
                    </span>
                  </li>
                ))}
                {estimate.personnelCount > 0 ? (
                  <li className="flex justify-between text-white/90">
                    <span>Asador(es) a domicilio</span>
                    <span>
                      {estimate.personnelCount} {estimate.personnelCount === 1 ? 'persona' : 'personas'} · {formatMXN(estimate.personnelCost)}
                    </span>
                  </li>
                ) : null}
                {estimate.transportCost > 0 ? (
                  <li className="flex justify-between text-white/90">
                    <span>Traslado ({distanceKm.toFixed(1)} km)</span>
                    <span>{formatMXN(estimate.transportCost)}</span>
                  </li>
                ) : null}
              </ul>
              <div className="mt-4 space-y-1 border-t border-beef-line pt-3 text-sm">
                <div className="flex justify-between text-white/70">
                  <span>Comida</span>
                  <span>{formatMXN(estimate.foodCost)}</span>
                </div>
                {estimate.baseServiceCost > 0 ? (
                  <div className="flex justify-between text-white/70">
                    <span>Servicio</span>
                    <span>{formatMXN(estimate.baseServiceCost)}</span>
                  </div>
                ) : null}
                {estimate.personnelCost > 0 ? (
                  <div className="flex justify-between text-white/70">
                    <span>Asador</span>
                    <span>{formatMXN(estimate.personnelCost)}</span>
                  </div>
                ) : null}
                {estimate.transportCost > 0 ? (
                  <div className="flex justify-between text-white/70">
                    <span>Traslado</span>
                    <span>{formatMXN(estimate.transportCost)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-lg font-bold text-white">
                  <span>Total estimado</span>
                  <span>{formatMXN(estimate.total)}</span>
                </div>
              </div>

              <button
                onClick={handleSend}
                disabled={!clientPhoneE164}
                className={`mt-4 flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-50 ${
                  clientPhoneE164 ? 'bg-beef-accent text-black' : 'bg-beef-accent/50 text-black/60'
              }`}
              >
                {clientPhoneE164 ? 'Enviar cotización por WhatsApp' : 'Ingresa un WhatsApp válido'}
              </button>

              <button
                onClick={() => window.print()}
                className="mt-2 flex w-full items-center justify-center rounded-2xl border border-beef-line bg-black/20 px-4 py-3 text-sm font-semibold text-white"
              >
                Crear PDF
              </button>

              <div className="mt-2 text-center text-xs text-white/50">
                El precio final se confirma al momento. Puedes ajustar los costos en Proveedores.
              </div>
            </div>
          </>
        )}
      </main>
      </div>

      {hasAccess ? (
        <div
          ref={pdfRef}
          className="hidden print:block w-[210mm] min-h-[297mm] bg-white p-8 text-sm text-black"
          style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
        >
          <div className="flex items-center gap-4 border-b-2 border-amber-500 pb-4 mb-6">
            <img
              src="https://beefmarketvhsa.web.app/logo.jpg?v=2"
              alt="BEEF MARKET"
              className="h-16 w-16 rounded-xl object-cover"
            />
            <div>
              <div className="text-2xl font-extrabold tracking-wide">BEEF MARKET</div>
              <div className="text-gray-600">{BUSINESS.addressShort}</div>
              <div className="text-gray-600">{BUSINESS.displayPhone}</div>
            </div>
          </div>

          <h2 className="text-xl font-bold mb-4">Cotización de su pedido en BEEF MARKET</h2>

          <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-700">Cliente:</span> {clientName || 'Sin nombre'}
            </div>
            <div>
              <span className="font-semibold text-gray-700">Teléfono:</span> {clientPhone || 'Sin teléfono'}
            </div>
            <div>
              <span className="font-semibold text-gray-700">Fecha:</span> {date || 'Por definir'}
            </div>
            <div>
              <span className="font-semibold text-gray-700">Personas:</span> {people}
            </div>
            <div className="col-span-2">
              <span className="font-semibold text-gray-700">Servicio:</span> {SERVICE_TYPES[serviceType].label}
            </div>
            <div className="col-span-2">
              <span className="font-semibold text-gray-700">Ubicación:</span>{' '}
              {clientMapsLink || (pin ? `https://www.google.com/maps?q=${pin.lat.toFixed(5)},${pin.lng.toFixed(5)}` : 'No especificada')}
            </div>
          </div>

          {address ? (
            <div className="mb-4 text-sm text-gray-700">
              <span className="font-semibold">Dirección:</span>{' '}
              {[
                address.address?.house_number,
                address.address?.road,
                address.address?.suburb,
                address.address?.city || address.address?.town || address.address?.village,
                address.address?.state,
                address.address?.postcode,
                address.address?.country,
              ]
                .filter(Boolean)
                .join(', ')}
            </div>
          ) : null}

          <table className="w-full border-collapse text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="py-2 text-left">Concepto</th>
                <th className="py-2 text-right">Cantidad</th>
                <th className="py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {estimate.details.map((d) => (
                <tr key={d.id} className="border-b border-gray-100">
                  <td className="py-2">{d.name}</td>
                  <td className="py-2 text-right">{d.amount.toFixed(2)} {d.unit}</td>
                  <td className="py-2 text-right">{formatMXN(d.subtotal)}</td>
                </tr>
              ))}
              {estimate.personnelCount > 0 ? (
                <tr className="border-b border-gray-100">
                  <td className="py-2">Asador(es) a domicilio</td>
                  <td className="py-2 text-right">{estimate.personnelCount} persona(s)</td>
                  <td className="py-2 text-right">{formatMXN(estimate.personnelCost)}</td>
                </tr>
              ) : null}
              {estimate.transportCost > 0 ? (
                <tr className="border-b border-gray-100">
                  <td className="py-2">Traslado ({distanceKm.toFixed(1)} km)</td>
                  <td className="py-2 text-right">-</td>
                  <td className="py-2 text-right">{formatMXN(estimate.transportCost)}</td>
                </tr>
              ) : null}
            </tbody>
          </table>

          <div className="mb-2 flex justify-between text-gray-700">
            <span>Costo comida</span>
            <span>{formatMXN(estimate.foodCost)}</span>
          </div>
          <div className="mb-2 flex justify-between text-gray-700">
            <span>Servicio</span>
            <span>{formatMXN(estimate.serviceCost)}</span>
          </div>

          <div className="mt-4 flex justify-between border-t-2 border-gray-200 pt-3 text-lg font-bold">
            <span>Total estimado</span>
            <span>{formatMXN(estimate.total)}</span>
          </div>

          <div className="mt-2 flex justify-between text-sm font-semibold text-gray-700">
            <span>Costo por persona</span>
            <span>{formatMXN(estimate.total / (Number(people) || 1))}</span>
          </div>

          <p className="mt-6 text-xs text-gray-500">
            Esperamos el comprobante de su transferencia del 50% a la cuenta XXX XXX XXXXX del banco XXXX para apartar su fecha.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Los precios no incluyen IVA.
          </p>
        </div>
      ) : null}
    </div>
  )
}
