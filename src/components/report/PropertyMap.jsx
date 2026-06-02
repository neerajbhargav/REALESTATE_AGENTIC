import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { MapPin, Landmark } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { fmtMoneyShort, fmtMoney } from "../../lib/format";

// Fix default marker icons (Leaflet + bundler issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const subjectIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "subject-marker",
});

// Generate stable offsets for comparable sales so they cluster around the subject lot naturally
const getOffsetCoords = (centerLat, centerLon, block, lot, index) => {
  const factor = 0.00018; // approx 15-20 meters offset spread
  const angle = (index * (360 / 8) + (parseInt(block || 0) % 30)) * (Math.PI / 180);
  const offsetLat = Math.sin(angle) * factor * (1 + (parseInt(lot || 0) % 5) * 0.15);
  const offsetLon = Math.cos(angle) * factor * (1 + (parseInt(lot || 0) % 5) * 0.15);
  return [centerLat + offsetLat, centerLon + offsetLon];
};

const createCompIcon = (price) => {
  const priceShort = fmtMoneyShort(price);
  return new L.DivIcon({
    html: `<div class="bg-[#0055FF] text-white font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-md border border-white flex items-center justify-center whitespace-nowrap hover:scale-110 transition-transform active:bg-zinc-950">${priceShort}</div>`,
    className: "custom-comp-marker-wrapper",
    iconSize: [45, 20],
    iconAnchor: [22, 10],
  });
};

export const PropertyMap = ({ coordinates, address, bbl, comps = [] }) => {
  if (!coordinates?.lat || !coordinates?.lon) {
    return (
      <div className="bg-white border border-zinc-200 rounded-sm p-6 flex items-center justify-center h-[320px]">
        <div className="flex items-center gap-2 text-zinc-400 font-mono text-sm">
          <MapPin className="w-4 h-4" />
          <span>Map unavailable — no coordinates returned</span>
        </div>
      </div>
    );
  }

  const center = [coordinates.lat, coordinates.lon];

  return (
    <div className="bg-white border border-zinc-200 rounded-sm overflow-hidden flex flex-col h-[380px]">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-zinc-200 shrink-0">
        <MapPin className="w-4 h-4" />
        <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-700">
          Geospatial Map &amp; comps overlay
        </h2>
        <span className="ml-auto font-mono text-[10px] text-zinc-400">
          {coordinates.lat.toFixed(6)}, {coordinates.lon.toFixed(6)}
        </span>
      </div>
      
      <div className="flex-1 relative">
        <MapContainer
          center={center}
          zoom={16}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          
          {/* Subject Property Marker */}
          <Marker position={center} icon={subjectIcon}>
            <Popup>
              <div className="font-sans text-xs max-w-[200px]">
                <p className="font-bold text-zinc-950">Subject Property</p>
                <p className="text-zinc-700 mt-1 font-medium">{address}</p>
                {bbl && <p className="text-zinc-400 mt-0.5 font-mono text-[9px]">BBL: {bbl}</p>}
              </div>
            </Popup>
          </Marker>

          {/* Comparable Sales Markers */}
          {comps.map((comp, idx) => {
            const compCenter = getOffsetCoords(
              coordinates.lat,
              coordinates.lon,
              comp.block,
              comp.lot,
              idx
            );
            return (
              <Marker
                key={comp.document_id || `marker-${idx}`}
                position={compCenter}
                icon={createCompIcon(comp.sale_price)}
              >
                <Popup>
                  <div className="font-sans text-xs max-w-[220px]">
                    <span className="bg-[#0055FF]/10 text-[#0055FF] text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono font-bold">
                      ACRIS Deed comp
                    </span>
                    <p className="font-bold text-zinc-950 mt-1.5">{comp.address}</p>
                    <div className="mt-1 flex flex-col gap-0.5 text-zinc-600 font-mono text-[10px]">
                      <p>Sale Price: <span className="text-zinc-950 font-bold">{fmtMoney(comp.sale_price)}</span></p>
                      <p>Sale Date: {comp.sale_date}</p>
                      {comp.implied_ppbsf && <p>Implied $/BSF: {fmtMoney(comp.implied_ppbsf)}</p>}
                      <p className="text-[9px] text-zinc-400 mt-1">Block {comp.block} · Lot {comp.lot}</p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
        
        {/* Legend */}
        {comps.length > 0 && (
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm border border-zinc-200 rounded px-2.5 py-1.5 z-[1000] text-[9px] font-mono shadow-sm pointer-events-none">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-blue-600 border border-white rounded shadow-sm inline-block" />
              <span className="text-zinc-600 font-bold">ACRIS Sale Price Comps</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-3.5 bg-sky-500 rounded-sm inline-block relative flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-white" />
              </span>
              <span className="text-zinc-600 font-bold">Subject Property</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyMap;
