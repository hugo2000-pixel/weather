"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix missing marker icons in react-leaflet
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapProps {
  lat: number;
  lon: number;
  onLocationSelect: (lat: number, lon: number) => void;
}

function MapEvents({ onLocationSelect }: { onLocationSelect: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapUpdater({ lat, lon }: { lat: number, lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], map.getZoom());
  }, [lat, lon, map]);
  return null;
}

export default function WeatherMap({ lat, lon, onLocationSelect }: MapProps) {
  return (
    <div className="h-[300px] w-full rounded-xl overflow-hidden border">
      <MapContainer center={[lat, lon]} zoom={10} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lon]} icon={icon} />
        <MapEvents onLocationSelect={onLocationSelect} />
        <MapUpdater lat={lat} lon={lon} />
      </MapContainer>
    </div>
  );
}
