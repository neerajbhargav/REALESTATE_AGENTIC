import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

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

const PropertyMap = ({ coordinates, address, bbl, comps = [] }) => {
  if (!coordinates?.lat || !coordinates?.lon) {
    return (
      <div className="bg-white border border-zinc-200 rounded-sm p-6 flex items-center justify-center h-[300px]">
        <div className="flex items-center gap-2 text-zinc-400 font-mono text-sm">
          <MapPin className="w-4 h-4" />
          <span>Map unavailable — no coordinates returned</span>
        </div>
      </div>
    );
  }

  const center = [coordinates.lat, coordinates.lon];

  return (
    <div className="bg-white border border-zinc-200 rounded-sm overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-zinc-200">
        <MapPin className="w-4 h-4" />
        <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-700">
          Property Location
        </h2>
        <span className="ml-auto font-mono text-[10px] text-zinc-400">
          {coordinates.lat.toFixed(6)}, {coordinates.lon.toFixed(6)}
        </span>
      </div>
      <div style={{ height: "320px", width: "100%" }}>
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
          <Marker position={center} icon={subjectIcon}>
            <Popup>
              <div className="font-sans text-xs">
                <p className="font-bold text-zinc-900">{address}</p>
                {bbl && <p className="text-zinc-500 mt-0.5">BBL: {bbl}</p>}
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
};

export default PropertyMap;
