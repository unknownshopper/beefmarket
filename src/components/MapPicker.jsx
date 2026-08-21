import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, CircleMarker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import 'leaflet-routing-machine'

const pinIcon = L.divIcon({
  html: `<div style="width:18px;height:18px;background:#f59e0b;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.4);"></div>`,
  className: 'transparent',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function SetView({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

function MapClick({ onClick }) {
  useMapEvents({
    click(e) {
      onClick({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

function RoutingMachine({ from, to, onDistance }) {
  const map = useMap()
  useEffect(() => {
    if (!from || !to || !map) return

    const control = L.Routing.control({
      waypoints: [L.latLng(from.lat, from.lng), L.latLng(to.lat, to.lng)],
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
      }),
      lineOptions: {
        styles: [{ color: '#f59e0b', weight: 5, opacity: 0.85 }],
      },
      show: false,
      addWaypoints: false,
      routeWhileDragging: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      createMarker: () => null,
    }).addTo(map)

    control.on('routesfound', (e) => {
      const r = e.routes[0]
      const meters = r?.summary?.totalDistance
      onDistance(typeof meters === 'number' ? meters / 1000 : null)
    })

    control.on('routingerror', () => {
      onDistance(null)
    })

    return () => {
      try {
        map.removeControl(control)
      } catch {}
    }
  }, [from, to, map, onDistance])

  return null
}

async function nominatimReverse(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18&accept-language=es`,
      { headers: { 'User-Agent': 'BEEF-MARKET-COTIZADOR' } }
    )
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

async function nominatimSearch(query) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=1&addressdetails=1&countrycodes=mx&accept-language=es`,
      { headers: { 'User-Agent': 'BEEF-MARKET-COTIZADOR' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return Array.isArray(data) ? data : null
  } catch {
    return null
  }
}

function parseGoogleMapsCoords(link) {
  if (!link) return null
  // Formato: .../@17.xxx,-92.xxx,...
  let m = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) }
  // Formato: ?q=17.xxx,-92.xxx
  m = link.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) }
  // Formato: !3d17.xxx!4d-92.xxx
  m = link.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) }
  return null
}

export default function MapPicker({ business, pin, onChange, onDistance, onAddress, onMapsLink }) {
  const [cp, setCp] = useState('')
  const [cpCenter, setCpCenter] = useState(null)
  const [addressQuery, setAddressQuery] = useState('')
  const [mapsLink, setMapsLink] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!pin) {
      onAddress?.(null)
      onDistance?.(0)
      return
    }
    let active = true
    nominatimReverse(pin.lat, pin.lng).then((data) => {
      if (active) onAddress?.(data)
    })
    return () => {
      active = false
    }
  }, [pin, onAddress, onDistance])

  async function searchCP() {
    if (!cp.trim()) return
    setLoading(true)
    const results = await nominatimSearch(`${cp.trim()}, Villahermosa, Tabasco, México`)
    setLoading(false)
    if (results?.[0]) {
      setCpCenter([Number(results[0].lat), Number(results[0].lon)])
    }
  }

  async function searchAddress() {
    if (!addressQuery.trim()) return
    setLoading(true)
    const results = await nominatimSearch(`${addressQuery.trim()}, Villahermosa, Tabasco, México`)
    setLoading(false)
    if (results?.[0]) {
      onChange({ lat: Number(results[0].lat), lng: Number(results[0].lon) })
      setCpCenter([Number(results[0].lat), Number(results[0].lon)])
    }
  }

  function useMapsLink() {
    const coords = parseGoogleMapsCoords(mapsLink)
    if (coords) {
      onChange(coords)
      setCpCenter([coords.lat, coords.lng])
    } else if (onMapsLink) {
      onMapsLink(mapsLink.trim())
    }
    setMapsLink('')
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={cp}
            onChange={(e) => setCp(e.target.value.replace(/\D/g, '').slice(0, 5))}
            onKeyDown={(e) => e.key === 'Enter' && searchCP()}
            placeholder="CP"
            className="w-full rounded-2xl border border-beef-line bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-beef-accent"
          />
          <button
            onClick={searchCP}
            className="rounded-2xl bg-beef-accent px-3 py-2 text-sm font-semibold text-black"
          >
            CP
          </button>
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <input
            type="text"
            value={addressQuery}
            onChange={(e) => setAddressQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchAddress()}
            placeholder="Calle, número, colonia..."
            className="w-full rounded-2xl border border-beef-line bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-beef-accent"
          />
          <button
            onClick={searchAddress}
            className="rounded-2xl bg-beef-accent px-3 py-2 text-sm font-semibold text-black"
          >
            Buscar
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={mapsLink}
          onChange={(e) => setMapsLink(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && useMapsLink()}
          placeholder="https://maps.app.goo.gl/... o enlace largo de Google Maps"
          className="w-full rounded-2xl border border-beef-line bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-beef-accent"
        />
        <button
          onClick={useMapsLink}
          className="rounded-2xl border border-beef-line bg-black/20 px-3 py-2 text-sm font-medium text-white"
        >
          Usar
        </button>
      </div>

      <MapContainer
        center={[business.lat, business.lng]}
        zoom={13}
        scrollWheelZoom={true}
        className="h-80 w-full rounded-2xl border border-beef-line"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {cpCenter ? <SetView center={cpCenter} zoom={16} /> : null}
        <CircleMarker
          center={[business.lat, business.lng]}
          radius={8}
          pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 1 }}
        />
        {pin ? (
          <>
            <Marker position={[pin.lat, pin.lng]} icon={pinIcon} />
            <RoutingMachine from={business} to={pin} onDistance={onDistance} />
          </>
        ) : null}
        <MapClick onClick={onChange} />
      </MapContainer>

      {loading ? (
        <div className="text-xs text-white/60">Buscando...</div>
      ) : null}

      <p className="text-xs text-white/60">
        Toca el mapa, usa el buscador, el CP o pega un enlace de Google Maps. Si el enlace es corto, usa la opción de búsqueda.
      </p>
    </div>
  )
}
