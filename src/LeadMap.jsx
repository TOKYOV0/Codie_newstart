import { useEffect, useRef } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
import { ArrowUpRight, MapPin } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

function MapFocus({ lead }) {
  const map = useMap()

  useEffect(() => {
    const latitude = Number(lead?.Latitude)
    const longitude = Number(lead?.Longitude)
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      map.flyTo([latitude, longitude], Math.max(map.getZoom(), 14), { duration: 0.6 })
    }
  }, [lead, map])

  return null
}

function OpenPopupOnMount({ children }) {
  const popupRef = useRef(null)
  const map = useMap()

  useEffect(() => {
    map.whenReady(() => {
      popupRef.current?._source?.openPopup()
    })
  }, [map])

  return <Popup ref={popupRef}>{children}</Popup>
}

function hasCoordinates(lead) {
  return Number.isFinite(Number(lead.Latitude)) && Number.isFinite(Number(lead.Longitude))
}

export default function LeadMap({ leads, selectedLead, onSelect }) {
  const mappedLeads = leads.filter(hasCoordinates)
  const centerLead = hasCoordinates(selectedLead) ? selectedLead : mappedLeads[0]
  const center = centerLead
    ? [Number(centerLead.Latitude), Number(centerLead.Longitude)]
    : [40.7128, -74.006]

  return (
    <div className="map-frame">
      <MapContainer center={center} zoom={centerLead ? 13 : 10} scrollWheelZoom className="lead-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapFocus lead={selectedLead} />
        {mappedLeads.map((lead) => {
          const position = [Number(lead.Latitude), Number(lead.Longitude)]
          const isSelected = lead['Lead ID'] === selectedLead?.['Lead ID']
          return (
            <CircleMarker
              key={lead['Lead ID']}
              center={position}
              radius={isSelected ? 9 : 7}
              pathOptions={{ color: isSelected ? '#ffffff' : '#f7fff7', weight: 3, fillColor: isSelected ? '#cf775a' : '#37744b', fillOpacity: 1 }}
              eventHandlers={{ click: () => onSelect(lead) }}
            >
              {isSelected && (
                <OpenPopupOnMount>
                  <div className="map-popup">
                    <span className="map-popup-category">{lead['Google Maps Category'] || 'Business'}</span>
                    <strong>{lead['Business Name']}</strong>
                    <span>{lead['Full Address'] || lead['City / Area']}</span>
                    {lead['Google Rating'] && <span className="map-popup-rating">★ {lead['Google Rating']} · {lead['Review Count'] || 0} reviews</span>}
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead['Full Address'] || lead['Business Name'])}`} target="_blank" rel="noreferrer">Open in Google Maps <ArrowUpRight size={13} /></a>
                  </div>
                </OpenPopupOnMount>
              )}
            </CircleMarker>
          )
        })}
      </MapContainer>
      <div className="map-count"><MapPin size={13} /> {mappedLeads.length} mapped {mappedLeads.length === 1 ? 'lead' : 'leads'}</div>
      {mappedLeads.length === 0 && <div className="map-empty"><MapPin size={20} /><span>Live search results with coordinates will appear here.</span></div>}
    </div>
  )
}
