import { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, Layers, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { useFloatChat } from "@/contexts/FloatChatContext";

interface LeafletMap {
  setView: (center: number[], zoom: number) => void;
  getZoom: () => number;
  getCenter: () => { lat: number; lng: number };
  remove: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  on: (event: string, handler: () => void) => void;
  off: (event: string, handler: () => void) => void;
}

interface LeafletMarker {
  addTo: (map: LeafletMap) => LeafletMarker;
  remove: () => void;
  on: (event: string, handler: () => void) => LeafletMarker;
  bindTooltip: (content: string, options: { permanent: boolean; direction: string }) => LeafletMarker;
}

export function MapView() {
  const [selectedFloat, setSelectedFloat] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(5);
  const [userInteracting, setUserInteracting] = useState(false);
  const [lastContextUpdate, setLastContextUpdate] = useState<number>(0);
  const userInteractionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Array<{ marker: LeafletMarker; float: typeof argoFloats[0] }>>([]);
  const { argoData, mapCenter, mapZoom, highlightedFloat, setHighlightedFloat } = useFloatChat();

  // Process ARGO data for map display
  const argoFloats = argoData.map(float => ({
    id: float._id.replace(/_003$/, ""),
    lat: float.geolocation?.coordinates?.[1] || 0,
    lng: float.geolocation?.coordinates?.[0] || 0,
    status: float.timestamp && (new Date().getTime() - new Date(float.timestamp).getTime()) < 1000 * 60 * 60 * 24 * 180 ? "active" : "inactive",
    type: float.basin === 3 ? "BGC" : "Core",
    lastUpdate: float.timestamp ? "new" : "old",
    temperature: float.data?.[4]?.[0],
    salinity: float.data?.[2]?.[0],
    oxygen: float.data?.[8]?.[0],
    depth: float.data?.[0]?.[0]
  })).filter(float => float.lat !== 0 && float.lng !== 0);

  // Helper function to manage user interaction state
  const setUserInteractingWithTimeout = (interacting: boolean, timeoutMs: number = 5000) => {
    setUserInteracting(interacting);
    
    // Clear existing timeout
    if (userInteractionTimeoutRef.current) {
      clearTimeout(userInteractionTimeoutRef.current);
      userInteractionTimeoutRef.current = null;
    }
    
    if (interacting) {
      userInteractionTimeoutRef.current = setTimeout(() => {
        setUserInteracting(false);
      }, timeoutMs);
    }
  };

  useEffect(() => {
    // Load Leaflet CSS and JS
    const loadLeaflet = async () => {
      // Add CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
        document.head.appendChild(link);
      }

      // Load JS
      if (!(window as any).L) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
        script.onload = initializeMap;
        document.head.appendChild(script);
      } else {
        initializeMap();
      }
    };

    const initializeMap = () => {
      if (!mapRef.current || leafletMapRef.current) return;

      if (!mapRef.current) return;
      // Initialize map with context center and zoom
      const map = (window as any).L.map(mapRef.current, {
        center: mapCenter,
        zoom: mapZoom,
        minZoom: 3,
        maxZoom: 10,
        zoomControl: false, // We'll add custom controls
        attributionControl: true,
        preferCanvas: true
      });

      // Add tile layer (OpenStreetMap)
      (window as any).L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      leafletMapRef.current = map;

      // Track zoom level changes and user interactions
      map.on('zoomstart', () => {
        setUserInteractingWithTimeout(true, 8000);
      });

      map.on('zoomend', () => {
        setZoomLevel(map.getZoom());
        setUserInteractingWithTimeout(true, 8000);
      });

      // Track user interactions
      map.on('movestart', () => {
        setUserInteractingWithTimeout(true, 5000);
      });

      map.on('moveend', () => {
        setUserInteractingWithTimeout(true, 5000);
      });

      // Track mouse wheel and touch interactions
      map.on('wheel', () => {
        setUserInteractingWithTimeout(true, 8000);
      });

      // Track touch interactions for mobile
      map.on('touchstart', () => {
        setUserInteractingWithTimeout(true, 8000);
      });

      // Add ARGO float markers
      argoFloats.forEach(float => {
        const isActive = float.status === 'active';
        
        // Create custom icon
        const icon = (window as any).L.divIcon({
          html: `<div style="
            width: 16px; 
            height: 16px; 
            background: ${isActive ? '#3b82f6' : '#6b7280'}; 
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ${isActive ? 'animation: pulse 2s infinite;' : ''}
          "></div>
          <style>
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.2); opacity: 0.7; }
            }
          </style>`,
          className: 'custom-div-icon',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        const marker = (window as any).L.marker([float.lat, float.lng], { icon })
          .addTo(map)
          .on('click', () => {
            setSelectedFloat(float.id);
            setHighlightedFloat(float.id);
          });

        // Add tooltip
        marker.bindTooltip(`ARGO Float #${float.id}<br/>Type: ${float.type}<br/>Status: ${float.status}`, {
          permanent: false,
          direction: 'top'
        });

        markersRef.current.push({ marker, float });
      });
    };

    loadLeaflet();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
      // Clear any pending timeouts
      if (userInteractionTimeoutRef.current) {
        clearTimeout(userInteractionTimeoutRef.current);
        userInteractionTimeoutRef.current = null;
      }
    };
  }, [argoFloats, mapCenter, mapZoom, setHighlightedFloat]);

  // Update map center and zoom when context changes (but not when user is manually interacting)
  useEffect(() => {
    if (leafletMapRef.current && !userInteracting) {
      const currentTime = Date.now();
      setLastContextUpdate(currentTime);
      
      // Only update if the change is significant or if it's been a while since last update
      const timeSinceLastUpdate = currentTime - lastContextUpdate;
      const currentCenter = leafletMapRef.current.getCenter();
      const currentZoom = leafletMapRef.current.getZoom();
      
      const centerChanged = Math.abs(currentCenter.lat - mapCenter[0]) > 0.01 || 
                           Math.abs(currentCenter.lng - mapCenter[1]) > 0.01;
      const zoomChanged = Math.abs(currentZoom - mapZoom) > 0.5;
      
      if (centerChanged || zoomChanged || timeSinceLastUpdate > 10000) {
        leafletMapRef.current.setView(mapCenter, mapZoom);
      }
    }
  }, [mapCenter, mapZoom, userInteracting, lastContextUpdate]);

  const handleZoomIn = () => {
    if (leafletMapRef.current) {
      setUserInteractingWithTimeout(true, 10000);
      leafletMapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (leafletMapRef.current) {
      setUserInteractingWithTimeout(true, 10000);
      leafletMapRef.current.zoomOut();
    }
  };

  const handleFullscreen = () => {
    if (mapRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        mapRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div className="h-full w-full flex flex-col md:flex-row gap-4 bg-zinc-700">
      {/* Map Container */}
      <div className="flex-1 relative w-full">
        <div className="h-full overflow-hidden rounded-lg border border-zinc-300 bg-zinc-800 shadow-sm">
          {/* Map Controls */}
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 shadow-lg">
            <button
              onClick={handleZoomIn}
              className="p-2 bg-blue-600 text-white border border-blue-400 rounded shadow-lg hover:bg-blue-700 transition-colors backdrop-blur-sm"
              title="Zoom in"
              aria-label="Zoom in map"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 bg-blue-500 text-white border border-blue-400 rounded shadow-lg hover:bg-blue-600 transition-colors backdrop-blur-sm"
              title="Zoom out"
              aria-label="Zoom out map"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button 
              className="p-2 bg-blue-500 text-white border border-blue-400 rounded shadow-lg hover:bg-blue-600 transition-colors backdrop-blur-sm"
              title="Toggle layers"
              aria-label="Toggle map layers"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={handleFullscreen}
              className="p-2 bg-blue-500 text-white border border-blue-400 rounded shadow-lg hover:bg-blue-600 transition-colors backdrop-blur-sm"
              title="Toggle fullscreen"
              aria-label="Toggle fullscreen map"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>

          {/* Leaflet Map Container */}
          <div ref={mapRef} className="h-full w-full" />

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 z-[1000]">
            <div className="p-3 bg-blue-900/90 border border-blue-400 rounded shadow-lg text-white backdrop-blur-sm">
              <h4 className="text-sm font-medium mb-2">ARGO Floats</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse"></div>
                  <span>Active ({argoFloats.filter(f => f.status === "active").length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-200"></div>
                  <span>Inactive ({argoFloats.filter(f => f.status === "inactive").length})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Float Details Panel */}
      <div className="hidden md:block w-80">
        <div className="h-full p-4 bg-zinc-900 border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Float Details</h3>
            <span className="px-2 py-1 text-xs bg-zinc-700 border border-slate-200 rounded">
              Indian Ocean
            </span>
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
                          <span className="text-slate-600">Type:</span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            float.type === "BGC" 
                              ? "bg-blue-100 text-blue-800 border border-blue-200" 
                              : "bg-slate-100 text-slate-800 border border-slate-200"
                          }`}>
                            {float.type}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Status:</span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            float.status === "active" 
                              ? "bg-green-100 text-green-800 border border-green-200" 
                              : "bg-slate-100 text-slate-800 border border-slate-200"
                          }`}>
                            {float.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Position:</span>
                          <span className="font-mono text-xs">
                            {float.lat}°N, {float.lng}°E
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Last Update:</span>
                          <span className="text-xs">{float.lastUpdate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200">
                      <h5 className="font-medium mb-2">Recent Measurements</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Temperature:</span>
                          <span className="font-mono text-blue-600">28.4°C</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Salinity:</span>
                          <span className="font-mono text-blue-600">35.2 PSU</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Depth:</span>
                          <span className="font-mono text-blue-600">1,847m</span>
                        </div>
                        {float.type === "BGC" && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">Oxygen:</span>
                            <span className="font-mono text-blue-600">4.2 ml/L</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4">
                      <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                        <Navigation className="w-4 h-4" />
                        View Profile Data
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="text-center text-slate-500">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Click on a float marker to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
