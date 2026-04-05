import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ArgoFloat {
  _id: string;
  timestamp: string;
  geolocation: {
    coordinates: [number, number];
  };
  data: number[][];
  basin: number;
  profile_data?: any[];
}

interface ChatMessage {
  id: number;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface AnomalyEvent {
  id: string;
  type: "salinity_drop" | "omz_low_oxygen";
  title: string;
  description: string;
  severity: "low" | "moderate" | "high";
  floatId?: string;
  coordinates?: [number, number];
  value?: number;
  baseline?: number;
  occurredAt?: string;
  detectedAt: string;
}

interface FloatChatContextType {
  // Data
  argoData: ArgoFloat[];
  chatMessages: ChatMessage[];
  selectedFloats: string[];
  comparisonData: any[];
  anomalies: AnomalyEvent[];
  unreadAnomalyCount: number;
  
  // Map state
  mapCenter: [number, number];
  mapZoom: number;
  highlightedFloat: string | null;
  
  // Chart state
  chartData: any[];
  chartType: string;
  
  // UI state
  activeTab: string;
  
  // Actions
  addChatMessage: (message: ChatMessage) => void;
  setSelectedFloats: (floats: string[]) => void;
  setMapCenter: (center: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
  setHighlightedFloat: (floatId: string | null) => void;
  setChartData: (data: any[]) => void;
  setChartType: (type: string) => void;
  setActiveTab: (tab: string) => void;
  processChatMessage: (message: string) => Promise<void>;
  zoomToLocation: (location: string) => void;
  compareFloats: (floatIds: string[]) => void;
  detectAnomalies: () => void;
  markAnomaliesRead: () => void;
}

const FloatChatContext = createContext<FloatChatContextType | undefined>(undefined);

export const useFloatChat = () => {
  const context = useContext(FloatChatContext);
  if (!context) {
    throw new Error('useFloatChat must be used within a FloatChatProvider');
  }
  return context;
};

interface FloatChatProviderProps {
  children: ReactNode;
}

export const FloatChatProvider: React.FC<FloatChatProviderProps> = ({ children }) => {
  const [argoData, setArgoData] = useState<ArgoFloat[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      type: "ai",
      content: "Welcome to FloatChat! I'm your AI assistant for exploring ARGO ocean data. I can help you find floats by location, compare data, and analyze ocean parameters. Try asking me something like 'Show me floats near Mumbai' or 'Compare temperature data from different regions'.",
      timestamp: new Date(),
    },
  ]);
  const [selectedFloats, setSelectedFloats] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.5, 82.0]);
  const [mapZoom, setMapZoom] = useState<number>(5);
  const [highlightedFloat, setHighlightedFloat] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartType, setChartType] = useState<string>('temperature');
  const [activeTab, setActiveTab] = useState<string>('map');
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);
  const [lastOmzCount, setLastOmzCount] = useState<number>(0);
  const [unreadAnomalyCount, setUnreadAnomalyCount] = useState<number>(0);
  const [enableRealtime, setEnableRealtime] = useState<boolean>(true);
  const [realtimeIntervalMs, setRealtimeIntervalMs] = useState<number>(5 * 60 * 1000);

  // Location mapping for common queries
  const locationMap: { [key: string]: { center: [number, number], zoom: number } } = {
    'mumbai': { center: [19.0760, 72.8777], zoom: 8 },
    'lakshadweep': { center: [10.5, 72.5], zoom: 8 },
    'goa': { center: [15.2993, 74.1240], zoom: 8 },
    'kerala': { center: [10.8505, 76.2711], zoom: 7 },
    'chennai': { center: [13.0827, 80.2707], zoom: 8 },
    'kolkata': { center: [22.5726, 88.3639], zoom: 8 },
    'arabian sea': { center: [15.0, 70.0], zoom: 6 },
    'bay of bengal': { center: [15.0, 85.0], zoom: 6 },
    'indian ocean': { center: [12.5, 82.0], zoom: 5 },
    'equator': { center: [0.0, 80.0], zoom: 6 },
  };

  // Function to calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Function to find nearest ARGO float to a location
  const findNearestFloat = (targetLat: number, targetLon: number) => {
    if (argoData.length === 0) return null;
    
    let nearestFloat = null;
    let minDistance = Infinity;
    
    argoData.forEach(float => {
      if (float.geolocation?.coordinates) {
        const [lon, lat] = float.geolocation.coordinates;
        const distance = calculateDistance(targetLat, targetLon, lat, lon);
        if (distance < minDistance) {
          minDistance = distance;
          nearestFloat = float;
        }
      }
    });
    
    return nearestFloat;
  };

  // Fetch ARGO data on component mount
  useEffect(() => {
    async function fetchArgoFloats() {
      const cacheKey = "argoFloatCacheV3";
      const cacheTtlMs = 6 * 60 * 60 * 1000; // 6 hours
      const now = Date.now();
      const cachedRaw = localStorage.getItem(cacheKey);
      if (cachedRaw) {
        try {
          const cachedParsed = JSON.parse(cachedRaw);
          if (cachedParsed && Array.isArray(cachedParsed.floats) && typeof cachedParsed.timestamp === 'number') {
            const age = now - cachedParsed.timestamp;
            if (age < cacheTtlMs) {
              setArgoData(cachedParsed.floats);
              setTimeout(() => { detectAnomaliesInternal(cachedParsed.floats); }, 0);
              return;
            }
          }
        } catch {}
      }

      try {
        const wmoIds = [
          "1902669","1902670","1902671","1902672","1902673","1902674","1902675","1902676","1902677","1902767",
          "1902785","2900464","2900533","2900566","2900757","2900765","2900880","2900882","2900883","2901083",
          "2901090","2901091","2901256","2901257","2901260","2901261","2901266","2901267","2901283","2901285",
          "2901286","2901287","2901288","2901290","2901292","2901293","2901297","2901298","2901299","2901301",
          "2901302","2901303","2901305","2901306","2901307","2901308","2901330","2901331",
          "6990716","7901125","7901126","7901127","7901128","7901130","7901131","7901136","7902170","7902190",
          "7902200","7902242","7902243","7902244"
        ];
        // Helper: try to fetch latest profile for a platform; fallback to old fixed profile
        const fetchLatestForId = async (id: string) => {
          try {
            const urlLatest = `https://argovis-api.colorado.edu/argo?id=${id}&n=1&order=desc&data=all`;
            const res = await fetch(urlLatest);
            if (res.ok) {
              const json = await res.json();
              return json;
            }
          } catch {}
          try {
            const urlFallback = `https://argovis-api.colorado.edu/argo?id=${id}_003&data=all`;
            const res = await fetch(urlFallback);
            if (res.ok) {
              const json = await res.json();
              return json;
            }
          } catch {}
          return null;
        };

        const results = await Promise.all(wmoIds.map(id => fetchLatestForId(id)));
        const floats = results.flat().filter(f => f && f._id);

        setArgoData(floats);
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: now, floats }));
        setTimeout(() => { detectAnomaliesInternal(floats); }, 0);
      } catch (err) {
        console.error('Failed to fetch ARGO data:', err);
      }
    }
    
    fetchArgoFloats();
  }, []);

  // Safety: if ARGO data loads via any path and anomalies are empty, compute once
  useEffect(() => {
    if (argoData && argoData.length > 0 && anomalies.length === 0) {
      detectAnomaliesInternal(argoData);
    }
  }, [argoData]);

  // Lightweight ERDDAP polling to detect new activity and refresh details from Argovis
  useEffect(() => {
    if (!enableRealtime) return;
    let timer: ReturnType<typeof setInterval> | null = null;

    const pollErddap = async () => {
      try {
        // Query last 24h platform positions; if anything new appears, refresh Argovis data
        const url = 'https://erddap.ifremer.fr/erddap/tabledap/ArgoFloats.json?time,longitude,latitude,platform_number&time>=now-1day';
        const res = await fetch(url);
        if (!res.ok) return;
        const json = await res.json();
        const rows: any[] = json?.table?.rows || [];
        const platformNumbers = new Set(rows.map((r: any[]) => String(r[3])));
        const haveAny = argoData.some(f => {
          const id = f._id?.replace(/_003$/, '') || '';
          return platformNumbers.has(id);
        });
        // If ERDDAP reports platforms but our cache is empty or stale, force a refresh from Argovis
        if (platformNumbers.size > 0 && !haveAny) {
          localStorage.removeItem('argoFloatCacheV2');
          // Trigger the existing fetch by re-running the effect body
          (async () => {
            try {
              const wmoIds = [
                "1902669","1902670","1902671","1902672","1902673","1902674","1902675","1902676","1902677","1902767",
                "1902785","2900464","2900533","2900566","2900757","2900765","2900880","2900882","2900883","2901083",
                "2901090","2901091","2901256","2901257","2901260","2901261","2901266","2901267","2901283","2901285",
                "2901286","2901287","2901288","2901290","2901292","2901293","2901297","2901298","2901299","2901301",
                "2901302","2901303","2901305","2901306","2901307","2901308","2901330","2901331",
                "6990716","7901125","7901126","7901127","7901128","7901130","7901131","7901136","7902170","7902190",
                "7902200","7902242","7902243","7902244"
              ];
              const requests = wmoIds.map(id => 
                fetch(`https://argovis-api.colorado.edu/argo?id=${id}_003&data=all`)
                  .then(r => r.json())
                  .catch(() => null)
              );
              const results = await Promise.all(requests);
              const floats = results.flat().filter(f => f && f._id);
              setArgoData(floats);
              localStorage.setItem('argoFloatCacheV2', JSON.stringify(floats));
              detectAnomaliesInternal(floats);
            } catch {}
          })();
        }
      } catch {}
    };

    // Kick off immediately and then on interval
    pollErddap();
    timer = setInterval(pollErddap, realtimeIntervalMs);
    return () => { if (timer) clearInterval(timer); };
  }, [enableRealtime, realtimeIntervalMs, argoData]);

  // Helper: robust median
  const median = (values: number[]) => {
    const arr = values.filter(v => Number.isFinite(v)).slice().sort((a, b) => a - b);
    if (arr.length === 0) return NaN;
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
  };

  // Helper: standard deviation
  const stdDev = (values: number[]) => {
    const arr = values.filter(v => Number.isFinite(v));
    if (arr.length === 0) return NaN;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
  };

  // Internal detection implementation working on a provided dataset
  const detectAnomaliesInternal = (data: ArgoFloat[]) => {
    try {
      const nowIso = new Date().toISOString();
      const floats = data || argoData;
      if (!floats || floats.length === 0) {
        setAnomalies([]);
        return;
      }

      const surfaceSalinities = floats.map(f => f.data?.[2]?.[0]).filter((v): v is number => typeof v === 'number');
      const surfaceOxygens = floats.map(f => f.data?.[8]?.[0]).filter((v): v is number => typeof v === 'number');

      const salMedian = median(surfaceSalinities);
      const salStd = stdDev(surfaceSalinities);

      const omzThreshold = 2.0; // ml/L
      const detected: AnomalyEvent[] = [];

      // Rule 1: Salinity drop relative to cohort baseline
      floats.forEach(f => {
        const sal = f.data?.[2]?.[0];
        const coords = f.geolocation?.coordinates;
        if (typeof sal === 'number' && Number.isFinite(sal) && Number.isFinite(salMedian) && Number.isFinite(salStd)) {
          // Flag if well below median beyond 1.5 PSU or >2 std devs
          const belowMedian = (salMedian - sal) >= 1.5;
          const zScoreLow = salStd > 0 ? (sal - salMedian) / salStd <= -2 : false;
          if (belowMedian || zScoreLow) {
            detected.push({
              id: `${f._id}-salinity-${nowIso}`,
              type: "salinity_drop",
              title: "Sudden drop in salinity",
              description: "Surface salinity significantly below regional baseline — possible heavy rainfall or freshwater influx.",
              severity: (salMedian - sal) > 2.5 ? "high" : ((salMedian - sal) > 2.0 ? "moderate" : "low"),
              floatId: f._id.replace(/_003$/, ""),
              coordinates: coords ? [coords[1], coords[0]] : undefined,
              value: sal,
              baseline: salMedian,
              occurredAt: f.timestamp || nowIso,
              detectedAt: nowIso,
            });
          }
        }
      });

      // Rule 2: Oxygen minimum zone (low oxygen)
      const omzFloats = floats.filter(f => {
        const oxy = f.data?.[8]?.[0];
        return typeof oxy === 'number' && oxy <= omzThreshold;
      });

      omzFloats.forEach(f => {
        const oxy = f.data?.[8]?.[0] as number;
        const coords = f.geolocation?.coordinates;
        detected.push({
          id: `${f._id}-omz-${nowIso}`,
          type: "omz_low_oxygen",
          title: "Low-oxygen waters detected",
          description: "Oxygen concentration at or below OMZ threshold — potential OMZ influence.",
          severity: oxy < 1.0 ? "high" : (oxy < 1.5 ? "moderate" : "low"),
          floatId: f._id.replace(/_003$/, ""),
          coordinates: coords ? [coords[1], coords[0]] : undefined,
          value: oxy,
          baseline: omzThreshold,
          occurredAt: f.timestamp || nowIso,
          detectedAt: nowIso,
        });
      });

      // Track expansion: if count increased since last detection, synthesize a summary event
      const currentOmzCount = omzFloats.length;
      if (currentOmzCount > lastOmzCount && currentOmzCount >= 3) {
        detected.push({
          id: `omz-expansion-${nowIso}`,
          type: "omz_low_oxygen",
          title: "Oxygen minimum zone expansion detected",
          description: `Number of low-oxygen floats increased from ${lastOmzCount} to ${currentOmzCount}.`,
          severity: currentOmzCount - lastOmzCount >= 3 ? "high" : "moderate",
          occurredAt: nowIso,
          detectedAt: nowIso,
        });
      }
      setLastOmzCount(currentOmzCount);

      // Determine newly detected events compared to current state
      const existingIds = new Set(anomalies.map(a => a.id));
      const newEventsCount = detected.filter(d => !existingIds.has(d.id)).length;

      setAnomalies(detected);

      // If user is not currently viewing events, increment unread count
      if (!(activeTab === 'charts' && chartType === 'events')) {
        if (newEventsCount > 0) {
          setUnreadAnomalyCount(prev => prev + newEventsCount);
        }
      } else {
        setUnreadAnomalyCount(0);
      }
    } catch (e) {
      console.error('Anomaly detection failed:', e);
    }
  };

  // Public API to trigger detection on current data
  const detectAnomalies = () => detectAnomaliesInternal(argoData);

  const markAnomaliesRead = () => setUnreadAnomalyCount(0);

  const addChatMessage = (message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
  };

  const processChatMessage = async (message: string) => {
    const userMessage: ChatMessage = {
      id: Date.now(),
      type: "user",
      content: message,
      timestamp: new Date(),
    };
    addChatMessage(userMessage);

    try {
      // Create context-aware prompt with ARGO data
      const dataContext = argoData.slice(0, 10).map(float => ({
        id: float._id.replace(/_003$/, ""),
        lat: float.geolocation?.coordinates?.[1],
        lng: float.geolocation?.coordinates?.[0],
        timestamp: float.timestamp,
        type: float.basin === 3 ? "BGC" : "Core",
        temperature: float.data?.[4]?.[0],
        salinity: float.data?.[2]?.[0],
        oxygen: float.data?.[8]?.[0],
        depth: float.data?.[0]?.[0]
      }));

      const contextPrompt = `You are an AI assistant specialized in ARGO ocean data analysis. You have access to real ARGO float data from the Indian Ocean region.

Available ARGO Float Data (sample):
${JSON.stringify(dataContext, null, 2)}

User Query: ${message}

Instructions:
1. If the user asks about locations (Mumbai, Lakshadweep, Goa, Kerala, Chennai, Kolkata, Arabian Sea, Bay of Bengal, Indian Ocean, Equator), respond with location information and mention that the map will zoom to that location.
2. If the user asks for comparisons, respond with comparison data and mention that charts will be updated.
3. If the user asks about specific floats or data, use the provided ARGO data context.
4. Always provide helpful oceanographic insights based on the data.
5. Keep responses informative but concise.

Respond in a helpful, oceanographic expert tone.`;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: contextPrompt }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Groq API request failed");
      }

      const data = await response.json();
      const text = data?.content ?? "Sorry, I couldn't generate a response.";

      const aiMessage: ChatMessage = {
        id: Date.now() + 1,
        type: "ai",
        content: text,
        timestamp: new Date(),
      };
      addChatMessage(aiMessage);

      // Process location-based queries
      const lowerMessage = message.toLowerCase();
      for (const [location, coords] of Object.entries(locationMap)) {
        if (lowerMessage.includes(location)) {
          // Find the nearest ARGO float to the city
          const nearestFloat = findNearestFloat(coords.center[0], coords.center[1]);
          
          if (nearestFloat && nearestFloat.geolocation?.coordinates) {
            // Zoom to the nearest float instead of city center
            const [lon, lat] = nearestFloat.geolocation.coordinates;
            setMapCenter([lat, lon]);
            setMapZoom(coords.zoom);
            setHighlightedFloat(nearestFloat._id);
          } else {
            // Fallback to city center if no floats found
            setMapCenter(coords.center);
            setMapZoom(coords.zoom);
            setHighlightedFloat(null);
          }
          break;
        }
      }

      // Process comparison queries
      if (lowerMessage.includes('compare') || lowerMessage.includes('comparison')) {
        const comparisonFloats = argoData.slice(0, 3).map(float => ({
          id: float._id.replace(/_003$/, ""),
          temperature: float.data?.[4]?.[0] || 0,
          salinity: float.data?.[2]?.[0] || 0,
          oxygen: float.data?.[8]?.[0] || 0,
          depth: float.data?.[0]?.[0] || 0
        }));
        setComparisonData(comparisonFloats);
        setChartType('compare');
      }

      // Anomaly/event handling is no longer triggered via chat

    } catch (error) {
      console.error("Error processing chat message:", error);
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        type: "ai",
        content: "Sorry, I encountered a network error while processing your request. Please try again.",
        timestamp: new Date(),
      };
      addChatMessage(errorMessage);
    }
  };

  const zoomToLocation = (location: string) => {
    const coords = locationMap[location.toLowerCase()];
    if (coords) {
      setMapCenter(coords.center);
      setMapZoom(coords.zoom);
    }
  };

  const compareFloats = (floatIds: string[]) => {
    const floats = argoData.filter(float => floatIds.includes(float._id));
    const comparisonData = floats.map(float => ({
      id: float._id.replace(/_003$/, ""),
      temperature: float.data?.[4]?.[0] || 0,
      salinity: float.data?.[2]?.[0] || 0,
      oxygen: float.data?.[8]?.[0] || 0,
      depth: float.data?.[0]?.[0] || 0
    }));
    setComparisonData(comparisonData);
    setChartType('compare');
    setActiveTab('charts'); // Automatically switch to charts tab
  };

  const value: FloatChatContextType = {
    argoData,
    chatMessages,
    selectedFloats,
    comparisonData,
    anomalies,
    unreadAnomalyCount,
    mapCenter,
    mapZoom,
    highlightedFloat,
    chartData,
    chartType,
    activeTab,
    addChatMessage,
    setSelectedFloats,
    setMapCenter,
    setMapZoom,
    setHighlightedFloat,
    setChartData,
    setChartType,
    setActiveTab,
    processChatMessage,
    zoomToLocation,
    compareFloats,
    detectAnomalies,
    markAnomaliesRead,
  };

  return (
    <FloatChatContext.Provider value={value}>
      {children}
    </FloatChatContext.Provider>
  );
};
