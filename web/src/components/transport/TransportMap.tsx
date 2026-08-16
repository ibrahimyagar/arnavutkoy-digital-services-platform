import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LANDMARKS, matchLandmark } from '../../lib/busLineVisuals'

type MarkerSpec = {
  label: string
  lat: number
  lng: number
  hint?: string
}

type Props = {
  title?: string
  origin?: string
  destination?: string
  selectedLabel?: string
}

function markersFor(origin?: string, destination?: string): MarkerSpec[] {
  if (!origin && !destination) {
    return LANDMARKS.map((point) => ({
      label: point.label,
      lat: point.lat,
      lng: point.lng,
      hint: point.hint,
    }))
  }
  const points = [matchLandmark(origin), matchLandmark(destination)].filter(
    (point): point is (typeof LANDMARKS)[number] => Boolean(point),
  )
  const unique = new Map(points.map((point) => [point.label, point]))
  return [...unique.values()].map((point) => ({
    label: point.label,
    lat: point.lat,
    lng: point.lng,
    hint: point.hint,
  }))
}

export function TransportMap({ title = 'Önemli noktalar', origin, destination, selectedLabel }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const markers = markersFor(origin, destination)
  const schematic = Boolean(origin || destination)

  useEffect(() => {
    const el = host.current
    if (!el) return
    const points = markersFor(origin, destination)

    const map = L.map(el, { scrollWheelZoom: false, attributionControl: true })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)

    const layer = L.featureGroup()
    for (const marker of points) {
      const circle = L.circleMarker([marker.lat, marker.lng], {
        radius: selectedLabel === marker.label ? 9 : 7,
        color: '#d89012',
        weight: 2,
        fillColor: '#171e24',
        fillOpacity: 0.9,
      })
      circle.bindPopup(
        `<strong>${marker.label}</strong><br/>${marker.hint ?? 'Önemli nokta (yaklaşık)'}<br/><em>Durak GPS’i değildir.</em>`,
      )
      circle.addTo(layer)
    }

    if (points.length >= 2) {
      L.polyline(
        points.map((marker) => [marker.lat, marker.lng] as L.LatLngExpression),
        { color: '#d89012', weight: 2, dashArray: '6 7', opacity: 0.85 },
      ).addTo(layer)
    }

    layer.addTo(map)
    if (points.length > 0) {
      map.fitBounds(layer.getBounds().pad(0.35), { maxZoom: 12 })
    } else {
      map.setView([41.1839, 28.7408], 11)
    }

    const resize = () => map.invalidateSize()
    window.setTimeout(resize, 80)
    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
      map.remove()
    }
  }, [origin, destination, selectedLabel])

  return (
    <section className="tx-map" id="harita" aria-labelledby="tx-map-title">
      <header className="tx-head">
        <p className="tx-kicker">Harita</p>
        <h2 id="tx-map-title">{title}</h2>
      </header>
      <p className="tx-muted">
        {schematic
          ? 'Kesik çizgi şematiktir. Durak koordinatı yoktur; OSM üzerindeki önemli noktalar yaklaşık konumdur.'
          : 'Noktalar durak GPS’i değildir. OSM üzerindeki ilçe / aktarma yerleridir.'}
      </p>
      {markers.length === 0 ? (
        <p className="tx-muted">
          Bu güzergâh uçları haritada işaretli değil.{' '}
          {origin ? (
            <a href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(origin)}`} target="_blank" rel="noreferrer">
              OSM’de ara
            </a>
          ) : null}
        </p>
      ) : (
        <div ref={host} className="tx-map-canvas" role="img" aria-label={title} />
      )}
      <ul className="tx-map-legend">
        {markers.map((marker) => (
          <li key={marker.label}>
            <Link to={`/hatlar?q=${encodeURIComponent(marker.label)}`}>
              {marker.label}
              <span>{marker.hint}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
