import { useState, useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { Search, Filter, Download, SortAsc, SortDesc, Eye, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useFloatChat } from "@/contexts/FloatChatContext";

export function DataTableView() {
  const { argoData, setSelectedFloats, compareFloats, setMapCenter, setMapZoom, setHighlightedFloat } = useFloatChat();
  const [showComparisonFeedback, setShowComparisonFeedback] = useState(false);
  // Modal state for map overlay
  const [mapModal, setMapModal] = useState<{ float: any } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeOnly, setActiveOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [floatsPerPage, setFloatsPerPage] = useState(20);
  const [sortDropdown, setSortDropdown] = useState("_id");

  const handleSort = (column: string) => {
    setSortDropdown(column);
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => {
      const newSelection = prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id];
      setSelectedFloats(newSelection);
      return newSelection;
    });
  };

  // Filter and sort logic
  const filteredData = useMemo(() => {
    let data = argoData.filter(row =>
      [row._id, row.timestamp, row.geolocation?.coordinates?.[1], row.geolocation?.coordinates?.[0], row.data?.[0]?.[0]].some(value =>
        value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
    if (activeOnly) {
      data = data.filter(row => row.timestamp && (new Date().getTime() - new Date(row.timestamp).getTime()) < 1000 * 60 * 60 * 24 * 180);
    }
    // Sort
    if (sortDropdown) {
      data = [...data].sort((a, b) => {
        const aValue = a[sortDropdown] ?? "";
        const bValue = b[sortDropdown] ?? "";
        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [argoData, searchQuery, activeOnly, sortDropdown, sortDirection]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / floatsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * floatsPerPage, currentPage * floatsPerPage);

  // Export handlers
  const handleExport = (type: "csv" | "xlsx") => {
    // Prepare data for export
    const exportRows = filteredData.map(row => ({
      WMO_ID: row._id.replace(/_003$/, ""),
      Type: row.basin === 3 ? "BGC" : "Core",
      DateTime: row.timestamp ? new Date(row.timestamp).toLocaleString() : "N/A",
      Latitude: row.geolocation?.coordinates?.[1],
      Longitude: row.geolocation?.coordinates?.[0],
      Depth: row.data?.[0]?.[0] ?? "N/A",
      Temperature: row.data?.[4]?.[0] ?? "N/A",
      Salinity: row.data?.[2]?.[0] ?? "N/A",
      Oxygen: row.data?.[8]?.[0] ?? "N/A",
      Status: (row.timestamp && (new Date().getTime() - new Date(row.timestamp).getTime()) < 1000 * 60 * 60 * 24 * 180) ? "active" : "inactive"
    }));
    if (type === "csv") {
      // Convert to CSV
      const header = Object.keys(exportRows[0]).join(",");
      const csv = exportRows.map(r => Object.values(r).map(v => `"${v}"`).join(",")).join("\n");
      const blob = new Blob([header + "\n" + csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "argo_floats.csv";
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Convert to XLSX
      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "ARGO Floats");
      XLSX.writeFile(wb, "argo_floats.xlsx");
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search ARGO data..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 glass ocean-transition"
            />
          </div>
          <label className="flex items-center gap-2 ml-4">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={e => {
                setActiveOnly(e.target.checked);
                setCurrentPage(1);
              }}
              className="accent-primary"
            />
            <span className="text-sm">Active Only</span>
          </label>
          <div className="ml-4">
            <Select value={sortDropdown} onValueChange={value => { setSortDropdown(value); setSortColumn(value); }}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_id">WMO ID</SelectItem>
                <SelectItem value="timestamp">Date/Time</SelectItem>
                <SelectItem value="depth">Depth</SelectItem>
                <SelectItem value="temperature">Temp</SelectItem>
                <SelectItem value="salinity">Salinity</SelectItem>
                <SelectItem value="oxygen">O₂</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="ml-4">
            <Select value={floatsPerPage.toString()} onValueChange={value => { setFloatsPerPage(Number(value)); setCurrentPage(1); }}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Rows/Page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="glass">
            {filteredData.length} records
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="glass ocean-transition hover:bio-glow">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("csv")}>Export as CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("xlsx")}>Export as Excel</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Data Table */}
      <Card className="flex-1 glass overflow-hidden">
        <div className="h-full overflow-auto">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading ARGO float data...</div>
          ) : error ? (
            <div className="p-8 text-center text-destructive">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      className="rounded border-border ocean-transition"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRows(filteredData.map(row => row._id));
                        } else {
                          setSelectedRows([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="cursor-pointer ocean-transition hover:text-primary" onClick={() => handleSort("_id")}>WMO ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="cursor-pointer ocean-transition hover:text-primary" onClick={() => handleSort("timestamp")}>Date/Time</TableHead>
                  <TableHead className="cursor-pointer ocean-transition hover:text-primary" onClick={() => handleSort("lat")}>Position</TableHead>
                  <TableHead className="cursor-pointer ocean-transition hover:text-primary" onClick={() => handleSort("depth")}>Depth (m)</TableHead>
                  <TableHead className="cursor-pointer ocean-transition hover:text-primary" onClick={() => handleSort("temperature")}>Temp (°C)</TableHead>
                  <TableHead className="cursor-pointer ocean-transition hover:text-primary" onClick={() => handleSort("salinity")}>Salinity (PSU)</TableHead>
                  <TableHead className="cursor-pointer ocean-transition hover:text-primary" onClick={() => handleSort("oxygen")}>O₂ (ml/L)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row) => {
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            className="glass"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Prev
          </Button>
          <span className="text-sm">Page {currentPage} of {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            className="glass"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
                  // Extract BGC params from data arrays if available
                  const depth = row.data?.[0]?.[0] ?? "N/A";
                  const temperature = row.data?.[4]?.[0] ?? "N/A";
                  const salinity = row.data?.[2]?.[0] ?? "N/A";
                  const oxygen = row.data?.[8]?.[0] ?? "N/A";
                  // Type badge
                  const type = row.basin === 3 ? "BGC" : "Core";
                  // Status (active if last profile timestamp within 180 days)
                  let latestTimestamp = row.timestamp;
                  if (Array.isArray(row.profile_data) && row.profile_data.length > 0) {
                    const profileTimes = row.profile_data.map(p => p.timestamp).filter(Boolean);
                    if (profileTimes.length > 0) {
                      latestTimestamp = profileTimes.sort().reverse()[0];
                    }
                  }
                  const isActive = latestTimestamp && (new Date().getTime() - new Date(latestTimestamp).getTime()) < 1000 * 60 * 60 * 24 * 180;
                  return (
                    <TableRow 
                      key={row._id} 
                      className={`border-border ocean-transition hover:bg-muted/20 ${
                        selectedRows.includes(row._id) ? "bg-primary/10" : ""
                      }`}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          className="rounded border-border ocean-transition"
                          checked={selectedRows.includes(row._id)}
                          onChange={() => toggleRowSelection(row._id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {row._id.replace(/_003$/, "")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={type === "BGC" ? "default" : "secondary"} className="glass">
                          {type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.timestamp ? new Date(row.timestamp).toLocaleString() : "N/A"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.geolocation?.coordinates?.[1]?.toFixed(2)}°N, {row.geolocation?.coordinates?.[0]?.toFixed(2)}°E
                      </TableCell>
                      <TableCell className="data-glow">{depth}</TableCell>
                      <TableCell className="data-glow">{temperature}</TableCell>
                      <TableCell className="data-glow">{salinity}</TableCell>
                      <TableCell className="data-glow">{oxygen}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={isActive ? "destructive" : "outline"}
                          className={isActive ? "bg-primary animate-pulse-glow" : "glass"}
                        >
                          {isActive ? "active" : "inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {/* <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="w-4 h-4" />
                          </Button> */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setMapModal({ float: row });
                              if (row.geolocation?.coordinates) {
                                setMapCenter([row.geolocation.coordinates[1], row.geolocation.coordinates[0]]);
                                setMapZoom(8);
                                setHighlightedFloat(row._id);
                              }
                            }}
                          >
                            <MapPin className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      {/* Selection Summary */}
      {selectedRows.length > 0 && (
        <Card className="p-3 glass">
          <div className="flex items-center justify-between">
            <span className="text-sm">
              {selectedRows.length} record{selectedRows.length !== 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="glass ocean-transition">
                Export Selected
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                className="glass ocean-transition hover:bio-glow"
                onClick={() => {
                  compareFloats(selectedRows);
                  setShowComparisonFeedback(true);
                  setTimeout(() => setShowComparisonFeedback(false), 3000);
                }}
              >
                📊 Compare Profiles
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedRows([])}
                className="ocean-transition"
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Comparison Feedback */}
      {showComparisonFeedback && (
        <Card className="p-3 glass border-primary animate-pulse">
          <div className="flex items-center gap-2 text-primary">
            <span className="text-lg">📊</span>
            <span className="text-sm font-medium">
              Redirecting to Charts section to view comparison...
            </span>
          </div>
        </Card>
      )}

      {/* Map & Info Modal - left-right layout */}
      {mapModal && mapModal.float && (
        <div
          style={{position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 9999, background: "rgba(20,30,40,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.3s"}}
          onClick={e => {
            // Only close if clicking the overlay, not the modal itself
            if (e.target === e.currentTarget) setMapModal(null);
          }}
        >
          <div style={{background: "rgba(30,40,60,0.97)", borderRadius: "18px", boxShadow: "0 8px 40px rgba(0,0,0,0.25)", padding: 0, minWidth: 700, minHeight: 440, maxWidth: 900, width: "90vw", height: "70vh", position: "relative", display: "flex", flexDirection: "row", border: "1px solid #2a3344", color: "#eaf6ff", fontFamily: "inherit", transition: "all 0.3s"}}>
            {/* Info Card - Left */}
            <div style={{flex: "0 0 320px", padding: "32px 28px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", background: "rgba(30,40,60,0.98)", borderRadius: "18px 0 0 18px", boxShadow: "0 2px 12px #1a2233"}}>
              <button
                style={{position: "absolute", top: 18, right: 22, fontSize: 26, fontWeight: "bold", color: "#a3bffa", background: "rgba(0,0,0,0.08)", border: "none", borderRadius: "6px", cursor: "pointer", width: 36, height: 36, lineHeight: "36px", textAlign: "center", transition: "color 0.2s", zIndex: 2}}
                onClick={() => setMapModal(null)}
                aria-label="Close"
                onMouseOver={e => (e.currentTarget.style.color = "#fff")}
                onMouseOut={e => (e.currentTarget.style.color = "#a3bffa")}
              >
                ×
              </button>
              <div style={{marginBottom: 18, fontWeight: 700, fontSize: 22, color: "#a3bffa", textShadow: "0 2px 8px #1a2233"}}>Float Details</div>
              <div style={{fontSize: 16, fontWeight: 600, marginBottom: 10}}>WMO ID: <span style={{color: "#a3bffa"}}>{mapModal.float._id.replace(/_003$/, "")}</span></div>
              <div style={{fontSize: 15, marginBottom: 8}}>Type: <span style={{color: "#a3bffa"}}>{mapModal.float.basin === 3 ? "BGC" : "Core"}</span></div>
              <div style={{fontSize: 15, marginBottom: 8}}>Status: <span style={{color: "#a3bffa"}}>{mapModal.float.timestamp && (new Date().getTime() - new Date(mapModal.float.timestamp).getTime()) < 1000 * 60 * 60 * 24 * 180 ? "Active" : "Inactive"}</span></div>
              <div style={{fontSize: 15, marginBottom: 8}}>Profiles: <span style={{color: "#a3bffa"}}>{Array.isArray(mapModal.float.profile_data) ? mapModal.float.profile_data.length : "N/A"}</span></div>
              <div style={{fontSize: 15, marginBottom: 8}}>Lat: <span style={{color: "#a3bffa"}}>{mapModal.float.geolocation?.coordinates?.[1]?.toFixed(4)}</span></div>
              <div style={{fontSize: 15, marginBottom: 8}}>Lon: <span style={{color: "#a3bffa"}}>{mapModal.float.geolocation?.coordinates?.[0]?.toFixed(4)}</span></div>
            </div>
            {/* Map - Right */}
            <div style={{flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 32px 24px 0"}}>
              {mapModal.float.geolocation?.coordinates ? (
                (() => {
                  const mapCenter = [mapModal.float.geolocation.coordinates[1], mapModal.float.geolocation.coordinates[0]] as [number, number];
                  const mapProps: any = {
                    center: mapCenter,
                    zoom: 4,
                    style: { height: "100%", width: "100%", minHeight: "340px", minWidth: "340px", borderRadius: "12px", boxShadow: "0 2px 12px #1a2233" },
                    scrollWheelZoom: false,
                  };
                  return (
                    <MapContainer {...mapProps}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={mapCenter}>
                        <Popup>
                          {mapModal.float._id.replace(/_003$/, "")}<br/>
                          {mapModal.float.geolocation.coordinates[1]?.toFixed(4)}, {mapModal.float.geolocation.coordinates[0]?.toFixed(4)}
                        </Popup>
                      </Marker>
                    </MapContainer>
                  );
                })()
              ) : (
                <div style={{textAlign: "center", color: "#a3bffa", fontWeight: 500}}>No coordinates available</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}