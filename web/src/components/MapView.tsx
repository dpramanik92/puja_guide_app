import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;

export interface MapMarker {
  name: string;
  lat: number;
  lng: number;
  type: "pandal" | "place" | "origin" | "destination";
  info: string;
}

export interface MapPolyline {
  coords: [number, number][];
  color: string;
}

export interface MapData {
  markers: MapMarker[];
  polylines: MapPolyline[];
  center: { lat: number; lng: number };
}

const ICON_COLORS: Record<MapMarker["type"], string> = {
  pandal: "#B22222",
  place: "#2563EB",
  origin: "#16A34A",
  destination: "#9333EA",
};

function makeIcon(type: MapMarker["type"]) {
  const color = ICON_COLORS[type];
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24S24 21 24 12C24 5.37 18.63 0 12 0z"
            fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>`
  );
  return L.icon({
    iconUrl: `data:image/svg+xml,${svg}`,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  });
}

export function MapView({ mapData }: { mapData: MapData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current).setView(
      [mapData.center.lat, mapData.center.lng],
      14
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapData.markers.forEach((m) => {
      L.marker([m.lat, m.lng], { icon: makeIcon(m.type) })
        .addTo(map)
        .bindPopup(`<b>${m.name}</b><br>${m.info}`);
    });

    mapData.polylines.forEach((p) => {
      L.polyline(p.coords, { color: p.color, weight: 4, opacity: 0.85 }).addTo(map);
    });

    if (mapData.markers.length > 1) {
      const bounds = L.latLngBounds(mapData.markers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [32, 32] });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [mapData]);

  return (
    <div
      ref={containerRef}
      style={{ height: 280, borderRadius: 8, marginTop: 8, overflow: "hidden" }}
    />
  );
}
