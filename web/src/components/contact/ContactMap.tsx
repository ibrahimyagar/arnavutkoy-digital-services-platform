import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CONTACT_LAT, CONTACT_LNG, CONTACT_ADDRESS } from '../../lib/contactCenter'

export function ContactMap() {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = host.current
    if (!el) return
    const map = L.map(el, { scrollWheelZoom: false, attributionControl: true })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)
    L.circleMarker([CONTACT_LAT, CONTACT_LNG], {
      radius: 9,
      color: '#1f6f6a',
      weight: 2,
      fillColor: '#152028',
      fillOpacity: 0.9,
    })
      .bindPopup(`<strong>${CONTACT_ADDRESS}</strong><br/>Demo konum — resmi adres değildir.`)
      .addTo(map)
    map.setView([CONTACT_LAT, CONTACT_LNG], 13)
    const resize = () => map.invalidateSize()
    window.setTimeout(resize, 80)
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      map.remove()
    }
  }, [])

  return <div ref={host} className="cm-map-canvas" role="img" aria-label="Demo konum haritası" />
}
