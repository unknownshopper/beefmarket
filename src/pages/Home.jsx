import { Link } from 'react-router-dom'
import Header from '../components/Header'
import SEO from '../components/SEO'
import { BUSINESS } from '../catalog'

const SITE = 'https://beefmarketvhsa.web.app'
const businessLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'BEEF MARKET',
  image: `${SITE}/logo.jpg?v=2`,
  telephone: `+52${BUSINESS.phoneE164.slice(2)}`,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Tulipanes #108, Fracc. Lago Ilusiones',
    addressLocality: 'Villahermosa',
    addressRegion: 'Tabasco',
    addressCountry: 'MX',
  },
  url: SITE,
  priceRange: '$$',
})

export default function Home() {
  return (
    <div className="min-h-dvh bg-beef-bg">
      <SEO
        title="BEEF MARKET | Cortes premium, quesos y parrilladas en Villahermosa"
        description="Cortes premium, quesos, embutidos y parrilladas para eventos en Villahermosa. Cotiza y pide por WhatsApp."
        url="/"
        type="website"
      >
        <script type="application/ld+json">{businessLd}</script>
      </SEO>
      <Header />
      <main className="px-4 pt-4 pb-6 safe-bottom">
      <section className="mb-8 text-center">
        <div className="mx-auto mb-4 h-28 w-28 overflow-hidden rounded-3xl border border-beef-line bg-black/20">
          <img src="/logo.jpg" alt={BUSINESS.name} className="h-full w-full object-cover" />
        </div>
        <h1 className="text-3xl font-bold tracking-wide">{BUSINESS.name}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/70">
          Cortes premium, quesos, embutidos y parrilladas para eventos. Cotiza y pide por WhatsApp.
        </p>
        <div className="mt-3 text-xs text-white/50">{BUSINESS.displayPhone}</div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/productos"
          className="group relative overflow-hidden rounded-3xl border border-beef-line bg-beef-card aspect-[4/3]"
        >
          <img
            src="https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=1200&q=80"
            alt="Productos en línea"
            className="absolute inset-0 h-full w-full object-cover opacity-80 transition-transform group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="text-xl font-bold">Olive by BEEF MARKET</div>
            <div className="mt-1 text-sm text-white/80">Tablas de carnes y quesos con accesorios.</div>
          </div>
        </Link>

        <Link
          to="/eventos"
          className="group relative overflow-hidden rounded-3xl border border-beef-line bg-beef-card aspect-[4/3]"
        >
          <img
            src="https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=1200&q=80"
            alt="Eventos"
            className="absolute inset-0 h-full w-full object-cover opacity-80 transition-transform group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="text-xl font-bold">Eventos</div>
            <div className="mt-1 text-sm text-white/80">Cotiza tu parrillada: día, personas y servicio.</div>
          </div>
        </Link>
      </div>
    </main>
    </div>
  )
}
