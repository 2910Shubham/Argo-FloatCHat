"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { MessageSquare, Map, BarChart3, Table, Settings, Download, Mic, Send, AlertTriangle, MapPin, Code2 } from "lucide-react";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatInterface } from "@/components/ChatInterface";
import { MapView } from "@/components/MapView";
import { DataVisualization } from "@/components/DataVisualization";
import dynamic from "next/dynamic";
import { NavigationHeader } from "@/components/NavigationHeader";
import { FloatChatProvider, useFloatChat } from "@/contexts/FloatChatContext";

const DataTableView = dynamic(
  () => import("@/components/DataTableView").then((m) => m.DataTableView),
  {
    ssr: false,
    loading: () => (
      <div className="p-6 text-sm text-muted-foreground">Loading floats table...</div>
    ),
  }
);

function FloatChatDashboardContent() {
  const { chatMessages, addChatMessage, activeTab, setActiveTab, setChartType, unreadAnomalyCount, markAnomaliesRead, anomalies, setMapCenter, setMapZoom, setHighlightedFloat } = useFloatChat() as any;
  const sortedAnomalies = useMemo(() => {
    if (!anomalies) return [];
    return [...anomalies].sort((a: any, b: any) => {
      const ta = new Date(a.occurredAt || a.detectedAt).getTime();
      const tb = new Date(b.occurredAt || b.detectedAt).getTime();
      return tb - ta;
    });
  }, [anomalies]);

  // State for chat panel width
  const [chatWidth, setChatWidth] = useState(400); // default 400px
  const minChatWidth = 280;
  const maxChatWidth = 600;
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<"map" | "chat" | "floats">("map");

  // Drag handler for resizer
  const isResizingRef = useRef(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isResizingRef.current = true;
    document.body.style.cursor = "col-resize";
  };

  const handleMouseUp = () => {
    isResizingRef.current = false;
    document.body.style.cursor = "";
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isResizingRef.current) {
      const newWidth = Math.min(Math.max(e.clientX, minChatWidth), maxChatWidth);
      setChatWidth(newWidth);
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  useEffect(() => {
    const updateIsMobile = () => setIsMobile(window.innerWidth < 768);
    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);
    return () => window.removeEventListener("resize", updateIsMobile);
  }, []);

  const handleSendMessage = (message: string) => {
    // Message handling is now done in the context
  };

  const handleReceiveMessage = (message: any) => {
    // Message handling is now done in the context
  };

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <NavigationHeader />
        <div className="flex-1 flex flex-col" style={{ height: "calc(100vh - 4rem)" }}>
          <div className="flex-1 overflow-hidden">
            {mobileView === "map" && <MapView />}
            {mobileView === "chat" && (
              <div className="h-full">
                <ChatInterface
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                  onReceiveMessage={handleReceiveMessage}
                />
              </div>
            )}
            {mobileView === "floats" && <DataTableView />}
          </div>
          <div className="border-t border-border glass p-2 grid grid-cols-3 gap-2">
            <Button
              variant={mobileView === "map" ? "default" : "outline"}
              size="sm"
              className="ocean-transition"
              onClick={() => {
                setMobileView("map");
                setActiveTab("map");
              }}
            >
              <Map className="w-4 h-4" />
              Map
            </Button>
            <Button
              variant={mobileView === "chat" ? "default" : "outline"}
              size="sm"
              className="ocean-transition"
              onClick={() => setMobileView("chat")}
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </Button>
            <Button
              variant={mobileView === "floats" ? "default" : "outline"}
              size="sm"
              className="ocean-transition"
              onClick={() => {
                setMobileView("floats");
                setActiveTab("data");
              }}
            >
              <Table className="w-4 h-4" />
              Floats
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <NavigationHeader />
      <div className="flex-1 flex flex-col md:flex-row" style={{ height: 'calc(100vh - 4rem)' }}>
        {/* Chat Panel - Left Side (Resizable) */}
        <div
          className="border-b md:border-b-0 md:border-r border-border flex flex-col animate-slide-in-left scrollbar-custom w-full md:w-auto h-[45vh] md:h-full"
          style={{ width: chatWidth, height: "100%", maxHeight: "100%" }}
        >
          <div className="flex-1 overflow-y-auto">
            <ChatInterface 
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              onReceiveMessage={handleReceiveMessage}
            />
          </div>
        </div>
        {/* Resizer */}
        <div
          onMouseDown={handleMouseDown}
          style={{ cursor: "col-resize", width: 8, zIndex: 20, background: "rgba(255,255,255,0.05)" }}
          className="hidden md:block hover:bg-primary/20 transition-colors"
        />
        {/* Visualization Panel - Right Side (Scrollable) */}
        <div className="flex-1 flex flex-col animate-slide-in-right overflow-y-auto scrollbar-custom min-h-[45vh]" style={{ height: '100%' }}>
          <div className="p-4 border-b border-border glass">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Ocean Data Explorer</h2>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm" className="ocean-transition" title="Developer/API">
                  <Link href="/developer" target="_blank" rel="noreferrer">
                    <Code2 className="w-4 h-4" />
                  </Link>
                </Button>
                <DropdownMenu onOpenChange={(open) => { if (open) markAnomaliesRead(); }}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="relative ocean-transition"
                      aria-label="View events"
                      title="View events"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      {unreadAnomalyCount > 0 && (
                        <span
                          className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center"
                          aria-label={`${unreadAnomalyCount} new events`}
                        >
                          {unreadAnomalyCount > 99 ? '99+' : unreadAnomalyCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[22rem] max-w-[28rem] z-[2000]">
                    <DropdownMenuLabel className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" />Recent Events</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {sortedAnomalies && sortedAnomalies.length > 0 ? (
                      <div className="max-h-[70vh] overflow-auto scrollbar-custom">
                        {sortedAnomalies.map((ev: any) => (
                          <DropdownMenuItem
                            key={ev.id}
                            className="flex items-start gap-3 py-3"
                            onSelect={() => {
                              if (ev.coordinates) {
                                setMapCenter(ev.coordinates);
                                setMapZoom(7);
                                if (ev.floatId) setHighlightedFloat(ev.floatId);
                                setActiveTab('map');
                              }
                            }}
                          >
                            <div className={`mt-1 w-2 h-2 rounded-full ${ev.severity === 'high' ? 'bg-red-500' : ev.severity === 'moderate' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                  ev.severity === 'high' ? 'border-red-500/40 text-red-400 bg-red-500/10' : ev.severity === 'moderate' ? 'border-amber-500/40 text-amber-400 bg-amber-500/10' : 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                                }`}>{ev.severity?.toUpperCase?.()}</span>
                                <span className="text-xs font-semibold">{ev.title}</span>
                              </div>
                              <div className="text-[11px] opacity-80 mt-0.5">{ev.description}</div>
                              <div className="text-[11px] opacity-70 mt-1">
                                {ev.occurredAt ? new Date(ev.occurredAt).toLocaleString() : new Date(ev.detectedAt).toLocaleString()}
                              </div>
                            </div>
                            {ev.coordinates && <MapPin className="w-3 h-3 ml-2 opacity-70" />}
                          </DropdownMenuItem>
                        ))}
                      </div>
                    ) : (
                      <DropdownMenuItem disabled>No events</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          <div className="flex-1 p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3 glass">
                <TabsTrigger value="map" className="flex items-center gap-2">
                  <Map className="w-4 h-4" />
                  Map View
                </TabsTrigger>
                <TabsTrigger value="charts" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Charts
                </TabsTrigger>
                <TabsTrigger value="data" className="flex items-center gap-2">
                  <Table className="w-4 h-4" />
                  Data Table
                </TabsTrigger>
              </TabsList>
              <TabsContent value="map" className="flex-1 mt-4">
                <MapView />
              </TabsContent>
              <TabsContent value="charts" className="flex-1 mt-4">
                <DataVisualization />
              </TabsContent>
              <TabsContent value="data" className="flex-1 mt-4">
                <DataTableView />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FloatChatDashboard() {
  return (
    <FloatChatProvider>
      <FloatChatDashboardContent />
    </FloatChatProvider>
  );
}
