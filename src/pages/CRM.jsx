import { useEffect, useMemo, useState } from 'react'
import Header from '../components/Header'
import Login from '../components/Login'
import { useAuth } from '../contexts/AuthContext'
import { canAccessEventos, getRole } from '../lib/roles'
import { getClients } from '../lib/clients'
import { getQuotes, updateQuoteStatus } from '../lib/quotes'
import { formatMXN } from '../lib/money'

const STATUS_OPTIONS = ['pendiente', 'confirmada', 'entregada', 'cancelada']

function phoneLink(phoneE164) {
  return phoneE164 ? `https://wa.me/${phoneE164}` : null
}

export default function CRM() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('eventos')
  const [quotes, setQuotes] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let active = true
    setLoading(true)
    Promise.all([getQuotes(), getClients()]).then(([q, c]) => {
      if (!active) return
      setQuotes(q)
      setClients(c)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [user])

  const today = new Date().toISOString().split('T')[0]
  const upcoming = useMemo(
    () =>
      quotes
        .filter((q) => q.date && q.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date) || b.createdAt.localeCompare(a.createdAt)),
    [quotes, today]
  )

  const past = useMemo(
    () =>
      quotes
        .filter((q) => !q.date || q.date < today)
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
    [quotes, today]
  )

  const allClients = useMemo(
    () => clients.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')),
    [clients]
  )

  async function changeStatus(id, status) {
    try {
      await updateQuoteStatus(id, status)
      setQuotes((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status, updatedAt: new Date().toISOString() } : q))
      )
    } catch (err) {
      console.error('Error actualizando estado:', err)
    }
  }

  if (user === undefined) {
    return (
      <div className="min-h-dvh bg-beef-bg">
        <Header />
        <main className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="text-sm text-white/60">Cargando...</div>
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-dvh bg-beef-bg">
        <Header />
        <main className="flex min-h-[60vh] items-center justify-center px-4 pt-6 safe-bottom">
          <Login title="Acceso al CRM" subtitle="Solo Nora o administradores." />
        </main>
      </div>
    )
  }

  const role = getRole(user.email)
  const hasAccess = canAccessEventos(role)

  return (
    <div className="min-h-dvh bg-beef-bg">
      <Header />

      <main className="px-4 pt-4 pb-6 safe-bottom">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">CRM</h1>
            <p className="mt-1 text-sm text-white/70">Eventos, entregas y clientes potenciales.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50">{user.email}</span>
            <button
              onClick={() => logout()}
              className="rounded-2xl border border-beef-line bg-black/20 px-3 py-2 text-xs font-medium text-white/80"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {!hasAccess ? (
          <div className="rounded-3xl border border-beef-line bg-beef-card p-6 text-center">
            <div className="text-lg font-semibold">Acceso restringido</div>
            <p className="mt-2 text-sm text-white/70">El CRM es exclusivo de Nora y administradores.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setTab('eventos')}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                  tab === 'eventos'
                    ? 'bg-beef-accent text-black'
                    : 'border border-beef-line bg-black/20 text-white/80'
                }`}
              >
                Próximos eventos
              </button>
              <button
                onClick={() => setTab('pasadas')}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                  tab === 'pasadas'
                    ? 'bg-beef-accent text-black'
                    : 'border border-beef-line bg-black/20 text-white/80'
                }`}
              >
                Cotizaciones pasadas
              </button>
              <button
                onClick={() => setTab('clientes')}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                  tab === 'clientes'
                    ? 'bg-beef-accent text-black'
                    : 'border border-beef-line bg-black/20 text-white/80'
                }`}
              >
                Clientes
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-sm text-white/60">Cargando...</div>
            ) : (
              <>
                {tab === 'eventos' && (
                  <div className="space-y-3">
                    {upcoming.length === 0 ? (
                      <p className="text-sm text-white/60">No hay eventos próximos.</p>
                    ) : (
                      upcoming.map((q) => (
                        <div
                          key={q.id}
                          className="rounded-3xl border border-beef-line bg-beef-card p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="text-sm font-semibold text-amber-500">
                                {q.date || 'Fecha por definir'}
                              </div>
                              <div className="text-base font-semibold text-white">{q.clientName || 'Cliente'}</div>
                              <div className="text-xs text-white/60">
                                {q.serviceLabel} · {q.people} personas · {formatMXN(q.total)}
                              </div>
                            </div>
                            <select
                              value={q.status || 'pendiente'}
                              onChange={(e) => changeStatus(q.id, e.target.value)}
                              className="rounded-xl border border-beef-line bg-black/20 px-2 py-1 text-sm text-white outline-none"
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="mt-2 text-xs text-white/70">
                            Tel: {q.clientPhone}{' '}
                            {q.clientPhoneE164 && (
                              <a
                                href={phoneLink(q.clientPhoneE164)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-amber-500 underline"
                              >
                                WhatsApp
                              </a>
                            )}
                          </div>
                          {q.clientMapsLink || q.pin ? (
                            <div className="mt-1 text-xs text-white/60">
                              Ubicación:{' '}
                              <a
                                href={
                                  q.clientMapsLink ||
                                  `https://www.google.com/maps?q=${q.pin.lat},${q.pin.lng}`
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="text-amber-500 underline"
                              >
                                Ver en mapa
                              </a>
                            </div>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {tab === 'pasadas' && (
                  <div className="space-y-3">
                    {past.length === 0 ? (
                      <p className="text-sm text-white/60">No hay cotizaciones pasadas.</p>
                    ) : (
                      past.map((q) => (
                        <div
                          key={q.id}
                          className="rounded-3xl border border-beef-line bg-beef-card p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="text-sm font-semibold text-white/80">
                                {q.date || 'Fecha por definir'}
                              </div>
                              <div className="text-base font-semibold text-white">{q.clientName || 'Cliente'}</div>
                              <div className="text-xs text-white/60">
                                {q.serviceLabel} · {q.people} personas · {formatMXN(q.total)}
                              </div>
                            </div>
                            <select
                              value={q.status || 'pendiente'}
                              onChange={(e) => changeStatus(q.id, e.target.value)}
                              className="rounded-xl border border-beef-line bg-black/20 px-2 py-1 text-sm text-white outline-none"
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="mt-2 text-xs text-white/70">
                            Tel: {q.clientPhone}{' '}
                            {q.clientPhoneE164 && (
                              <a
                                href={phoneLink(q.clientPhoneE164)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-amber-500 underline"
                              >
                                WhatsApp
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {tab === 'clientes' && (
                  <div className="space-y-3">
                    {allClients.length === 0 ? (
                      <p className="text-sm text-white/60">No hay clientes guardados.</p>
                    ) : (
                      allClients.map((c) => (
                        <div
                          key={c.id}
                          className="rounded-3xl border border-beef-line bg-beef-card p-4"
                        >
                          <div className="text-base font-semibold text-white">{c.name || 'Sin nombre'}</div>
                          <div className="text-xs text-white/60">{c.phone}</div>
                          {c.pin || c.clientMapsLink ? (
                            <div className="mt-1 text-xs text-white/60">
                              <a
                                href={
                                  c.clientMapsLink ||
                                  `https://www.google.com/maps?q=${c.pin.lat},${c.pin.lng}`
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="text-amber-500 underline"
                              >
                                Ver ubicación
                              </a>
                            </div>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
