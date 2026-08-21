import { useEffect, useMemo, useState } from 'react'
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
  haversineDistance,
  loadInventory,
  SERVICE_TYPES,
  TRANSPORT_RATE_PER_KM,
} from '../lib/inventory'

export default function Eventos() {
  const { user, logout } = useAuth()
  const [clientName, setClientName] = useState('')
  const [date, setDate] = useState('')
  const [people, setPeople] = useState(20)
  const [serviceType, setServiceType] = useState('basica')
  const [pin, setPin] = useState(null)
  const [routeDistanceKm, setRouteDistanceKm] = useState(null)
  const [address, setAddress] = useState(null)
  const [clientMapsLink, setClientMapsLink] = useState('')
  const [inventory, setInventory] = useState(() => loadInventory())

  useEffect(() => {
    setInventory(loadInventory())
  }, [])

  const straightDistanceKm = useMemo(
    () => (pin ? haversineDistance(BUSINESS_COORDS, pin) : 0),
    [pin]
  )

  const distanceKm = routeDistanceKm !== null ? routeDistanceKm : straightDistanceKm
  const transportCost = Math.round(distanceKm * TRANSPORT_RATE_PER_KM)

  const estimate = useMemo(
    () => calculateEventCost(inventory, Number(people) || 0, serviceType, transportCost),
    [inventory, people, serviceType, transportCost]
  )

  const messageLines = [
    `Hola ${clientName || 'Cliente'}, te envío la cotización de ${BUSINESS.name}.`,
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
    ...estimate.details.map((d) => `- ${d.name}: ${d.amount.toFixed(2)} ${d.unit} (${formatMXN(d.subtotal)})`),
    ...
      estimate.personnelCount > 0
        ? [`- Asador(es) a domicilio: ${estimate.personnelCount} (${formatMXN(estimate.personnelCost)})`]
        : [],
    ...
      estimate.transportCost > 0
        ? [`- Traslado: ${distanceKm.toFixed(1)} km · ${formatMXN(estimate.transportCost)}`]
        : [],
    '',
    `Costo comida: ${formatMXN(estimate.foodCost)}`,
    `Servicio: ${formatMXN(estimate.serviceCost)}`,
    `Total estimado: ${formatMXN(estimate.total)}`,
    '',
    '¿Me confirman disponibilidad y precio final?',
  ]

  const waUrl = buildWhatsAppUrl(BUSINESS.phoneE164, messageLines.join('\n'))

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
                        {formatMXN(TRANSPORT_RATE_PER_KM)}/km
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

              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex w-full items-center justify-center rounded-2xl bg-beef-accent px-4 py-3 text-sm font-semibold text-black"
              >
                Enviar por WhatsApp
              </a>

              <div className="mt-2 text-center text-xs text-white/50">
                El precio final se confirma al momento. Puedes ajustar los costos en Proveedores.
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
