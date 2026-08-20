import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BUSINESS } from '../catalog'

function MenuButton({ open, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
      className="relative flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-2xl border border-beef-line bg-black/20"
    >
      <span
        className={`h-0.5 w-5 rounded bg-current transition-transform duration-200 ${
          open ? 'translate-y-2 rotate-45' : ''
        }`}
      />
      <span
        className={`h-0.5 w-5 rounded bg-current transition-opacity duration-200 ${open ? 'opacity-0' : ''}`}
      />
      <span
        className={`h-0.5 w-5 rounded bg-current transition-transform duration-200 ${
          open ? '-translate-y-2 -rotate-45' : ''
        }`}
      />
    </button>
  )
}

export default function Header({ right = null }) {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const links = [
    { to: '/', label: 'Inicio' },
    { to: '/productos', label: 'Productos' },
    { to: '/eventos', label: 'Eventos' },
    { to: '/proveedores', label: 'Proveedores' },
  ]

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <header className="safe-top sticky top-0 z-50 border-b border-beef-line bg-beef-bg/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-3" onClick={closeMenu}>
          <div className="h-10 w-10 overflow-hidden rounded-2xl border border-beef-line bg-black/20">
            <img src="/logo.jpg" alt={BUSINESS.name} className="h-full w-full object-cover" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide">{BUSINESS.name}</div>
            <div className="text-xs text-white/60">{BUSINESS.addressShort}</div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {right ? <div className="shrink-0">{right}</div> : null}

          <nav className="hidden items-center gap-1 sm:flex">
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
          </nav>

          <div className="sm:hidden">
            <MenuButton open={menuOpen} onClick={() => setMenuOpen((v) => !v)} />
          </div>
        </div>
      </div>

      {menuOpen ? (
        <nav className="mt-3 rounded-3xl border border-beef-line bg-beef-card p-3 sm:hidden">
          {links.map((l) => {
            const active = pathname === l.to
            return (
              <Link
                key={l.to}
                to={l.to}
                onClick={closeMenu}
                className={`block rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-beef-accent text-black'
                    : 'text-white/80 hover:bg-white/5 hover:text-white'
                }`}
              >
                {l.label}
              </Link>
            )
          })}
        </nav>
      ) : null}
    </header>
  )
}
