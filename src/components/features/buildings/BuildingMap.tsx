// Import CSS statically (this is fine for client-side)
import "leaflet/dist/leaflet.css";

import { useEffect, useState } from "react";

interface BuildingMapProps {
  coordinates: {
    lat: number;
    lon: number;
  };
  address: string;
}

export function BuildingMap({ coordinates, address }: BuildingMapProps) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    // Dynamic import of map components to avoid SSR issues
    Promise.all([
      import("react-leaflet"),
      import("leaflet")
    ]).then(([{ MapContainer, TileLayer, Marker, Popup }, L]) => {
      // Fix default marker icons for CDN
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });

      // Create a component that uses the imported modules
      const DynamicMap = () => {
        const position: [number, number] = [coordinates.lat, coordinates.lon];

        return (
          <div className="rounded-lg border border-border overflow-hidden">
            <MapContainer center={position} zoom={16} scrollWheelZoom={false} style={{ height: "400px", width: "100%" }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={position}>
                <Popup>
                  <strong>{address}</strong>
                  <br />
                  Lat: {coordinates.lat.toFixed(6)}, Lon: {coordinates.lon.toFixed(6)}
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        );
      };

      setMapComponent(() => DynamicMap);
    }).catch((error) => {
      console.error("Error loading map components:", error);
    });
  }, [coordinates, address]);

  if (!MapComponent) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20">
        <p className="text-muted-foreground">Ładowanie mapy...</p>
      </div>
    );
  }

  return <MapComponent />;
}
