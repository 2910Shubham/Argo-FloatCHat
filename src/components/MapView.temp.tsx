import { useState, useEffect } from "react";
import { MapPin, Navigation, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createMarkerIcon = (isActive: boolean) => 
  L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="relative ${isActive ? 'text-primary animate-pulse' : 'text-muted-foreground'}">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });

export function MapView() {
  const [selectedFloat, setSelectedFloat] = useState<number | null>(null);

  // Mock ARGO float data
  const argoFloats = [
    { id: 1, lat: 15.5, lng: 73.2, status: "active", type: "BGC", lastUpdate: "2 hours ago" },
    { id: 2, lat: 8.3, lng: 77.8, status: "active", type: "Core", lastUpdate: "4 hours ago" },
    { id: 3, lat: 22.1, lng: 69.5, status: "inactive", type: "BGC", lastUpdate: "2 days ago" },
    { id: 4, lat: 12.8, lng: 80.1, status: "active", type: "Core", lastUpdate: "1 hour ago" },
  ];

  useEffect(() => {
    // Add custom styles for Leaflet map
    const style = document.createElement('style');
    style.textContent = `
      .leaflet-container {
        height: 100%;
        width: 100%;
        background: var(--map-background);
      }
      .custom-marker {
        background: none;
        border: none;
      }
      .custom-marker > div {
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.3s ease;
      }
      .custom-marker > div:hover {
        transform: scale(1.2);
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="h-full flex gap-4">
      {/* Map Container */}
      <div className="flex-1 relative">
        <Card className="h-full overflow-hidden glass">
          {(() => {
            const mapProps: any = {
              center: [15.5, 73.2],
              zoom: 5,
              className: "h-full w-full",
              style: { background: 'var(--map-background)' },
            };
            return (
              <MapContainer {...mapProps}>
                {(() => {
                  const tileLayerProps: any = {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                  };
                  return <TileLayer {...tileLayerProps} />;
                })()}

                {/* Layer Controls */}
                <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                  <Button size="sm" variant="outline" className="glass">
                    <Layers className="w-4 h-4" />
                  </Button>
                </div>

                {/* ARGO Float Markers */}
                {argoFloats.map((float) => {
                  const markerProps: any = {
                    key: float.id,
                    position: [float.lat, float.lng],
                    icon: createMarkerIcon(float.status === "active"),
                    eventHandlers: {
                      click: () => setSelectedFloat(float.id),
                    },
                  };
                  return (
                    <Marker {...markerProps}>
                      <Popup>
                        <div className="p-2">
                          <h4 className="font-medium">ARGO Float #{float.id}</h4>
                          <p className="text-sm text-muted-foreground">{float.type} - {float.status}</p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            );
          })()}

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 z-[1000]">
            <Card className="p-3 glass">
              <h4 className="text-sm font-medium mb-2">ARGO Floats</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  <span>Active ({argoFloats.filter(f => f.status === "active").length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                  <span>Inactive ({argoFloats.filter(f => f.status === "inactive").length})</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Coordinates Display */}
          <div className="absolute top-4 left-4 z-[1000]">
            <Card className="p-2 glass">
              <div className="text-xs font-mono">
                <div>Lat: 15°30'N</div>
                <div>Lng: 73°12'E</div>
              </div>
            </Card>
          </div>
        </Card>
      </div>

      {/* Float Details Panel */}
      <div className="w-80">
        <Card className="h-full p-4 glass">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Float Details</h3>
            <Badge variant="outline" className="glass">
              Indian Ocean
            </Badge>
          </div>

          {selectedFloat ? (
            <div className="space-y-4">
              {(() => {
                const float = argoFloats.find(f => f.id === selectedFloat);
                if (!float) return null;
                
                return (
                  <>
                    <div>
                      <h4 className="font-medium mb-2">ARGO Float #{float.id}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <Badge variant={float.type === "BGC" ? "default" : "secondary"} className="glass">
                            {float.type}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge 
                            variant={float.status === "active" ? "destructive" : "outline"}
                            className={float.status === "active" ? "bg-primary" : "glass"}
                          >
                            {float.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Position:</span>
                          <span className="font-mono text-xs">
                            {float.lat}°N, {float.lng}°E
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Update:</span>
                          <span className="text-xs">{float.lastUpdate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <h5 className="font-medium mb-2">Recent Measurements</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Temperature:</span>
                          <span className="data-glow">28.4°C</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Salinity:</span>
                          <span className="data-glow">35.2 PSU</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Depth:</span>
                          <span className="data-glow">1,847m</span>
                        </div>
                        {float.type === "BGC" && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Oxygen:</span>
                            <span className="data-glow">4.2 ml/L</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button className="w-full ocean-transition hover:bio-glow">
                        <Navigation className="w-4 h-4 mr-2" />
                        View Profile Data
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Click on a float marker to view details</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}