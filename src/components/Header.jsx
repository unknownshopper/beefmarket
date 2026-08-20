import { Link, useLocation } from 'react-router-dom'
import { BUSINESS } from '../catalog'

export default function Header({ right = null }) {
  const { pathname } = useLocation()

  const links = [
    { to: '/', label: 'Inicio' },
    { to: '/productos', label: 'Productos' },
    { to: '/eventos', label: 'Eventos' },
    { to: '/proveedores', label: 'Proveedores' },
  ]

  return (
    <header className="safe-top sticky top-0 z-40 border-b border-beef-line bg-beef-bg/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-2xl border border-beef-line bg-black/20">
            <img src="/logo.jpg" alt={BUSINESS.name} className="h-full w-full object-cover" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide">{BUSINESS.name}</div>
            <div className="text-xs text-white/60">{BUSINESS.addressShort}</div>
          </div>
        </Link>

        <div className="flex items-center gap-1 overflow-x-auto">
          {links.map((l) => {
            const active = pathname === l.to
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`whitespace-nowrap rounded-2xl px-3 py-2 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-beef-accent text-black'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                {l.label}
              </Link>
            )
          })}
          {right ? <div className="ml-2 flex items-center">{right}</div> : null}
        </div>
      </div>
    </header>
  )
}
