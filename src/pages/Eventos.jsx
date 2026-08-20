import { useEffect, useMemo, useState } from 'react'
import Header from '../components/Header'
import SEO from '../components/SEO'
import { BUSINESS } from '../catalog'
import { buildWhatsAppUrl } from '../lib/whatsapp'
import { formatMXN } from '../lib/money'
import { calculateEventCost, loadInventory, SERVICE_TYPES } from '../lib/inventory'

export default function Eventos() {
  const [date, setDate] = useState('')
  const [people, setPeople] = useState(20)
  const [serviceType, setServiceType] = useState('basica')
  const [inventory, setInventory] = useState(() => loadInventory())

  useEffect(() => {
    setInventory(loadInventory())
  }, [])

  const estimate = useMemo(
    () => calculateEventCost(inventory, Number(people) || 0, serviceType),
    [inventory, people, serviceType]
  )

  const messageLines = [
    `Hola, quiero cotizar una parrillada para evento en ${BUSINESS.name}.`,
    `Fecha: ${date || 'Por definir'}`,
    `Personas: ${people}`,
    `Servicio: ${SERVICE_TYPES[serviceType].label}`,
    '',
    'Resumen estimado:',
    ...estimate.details.map((d) => `- ${d.name}: ${d.amount.toFixed(2)} ${d.unit} (${formatMXN(d.subtotal)})`),
    ...
      estimate.personnelCount > 0
        ? [`- Asador(es) a domicilio: ${estimate.personnelCount} (${formatMXN(estimate.personnelCost)})`]
        : [],
    '',
    `Costo comida: ${formatMXN(estimate.foodCost)}`,
    `Servicio: ${formatMXN(estimate.serviceCost)}`,
    `Total estimado: ${formatMXN(estimate.total)}`,
    '',
    '¿Me confirman disponibilidad y precio final?',
  ]

  const waUrl = buildWhatsAppUrl(BUSINESS.phoneE164, messageLines.join('\n'))

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
        <div className="mb-4">
          <h1 className="text-xl font-semibold">Cotiza tu parrillada</h1>
          <p className="mt-1 text-sm text-white/70">Elige el día, número de personas y tipo de servicio.</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-beef-line bg-beef-card p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-beef-accent">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-beef-accent text-xs font-bold text-black">1</span>
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

          <div className="rounded-3xl border border-beef-line bg-[#0d0d0f] p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-beef-accent">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-beef-accent text-xs font-bold text-black">2</span>
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

          <div className="rounded-3xl border border-beef-line bg-beef-card p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-beef-accent">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-beef-accent text-xs font-bold text-black">3</span>
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
            Cotizar por WhatsApp
          </a>
          <div className="mt-2 text-center text-xs text-white/50">
            El precio final se confirma al momento. Puedes ajustar los costos en Proveedores.
          </div>
        </div>
      </main>
    </div>
  )
}
