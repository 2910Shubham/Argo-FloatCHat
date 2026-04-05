import { useState, useEffect } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, BarChart, Bar } from "recharts";
import { TrendingUp, TrendingDown, Activity, Droplet, Thermometer, AlertTriangle, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFloatChat } from "@/contexts/FloatChatContext";

export function DataVisualization() {
  const { comparisonData, chartType, argoData, anomalies, setMapCenter, setMapZoom, setActiveTab, setHighlightedFloat, markAnomaliesRead } = useFloatChat() as any;
  // Example depth profile data (pressure in dbar, temperature/salinity/oxygen)
  // Fewer pressure points for clarity
  const depthProfileData = [
    { pressure: 1000, temperature: 4.2, salinity: 34.7, oxygen: 3.1 },
    { pressure: 500, temperature: 12.3, salinity: 35.0, oxygen: 4.2 },
    { pressure: 100, temperature: 24.1, salinity: 35.2, oxygen: 5.0 },
    { pressure: 0, temperature: 28.4, salinity: 35.3, oxygen: 5.2 },
  ];
  // State for toggling lines in combined chart
  const [showTemperature, setShowTemperature] = useState(true);
  const [showSalinity, setShowSalinity] = useState(true);
  const [showOxygen, setShowOxygen] = useState(true);
  const [selectedChart, setSelectedChart] = useState(chartType || "temperature");
  const [depthMetric, setDepthMetric] = useState("temperature");

  // Update selected chart when context changes
  useEffect(() => {
    if (chartType) {
      setSelectedChart(chartType);
    }
  }, [chartType]);

  // When Events tab becomes active, mark anomalies as read
  useEffect(() => {
    if (selectedChart === 'events') {
      markAnomaliesRead?.();
    }
  }, [selectedChart]);

  // Chart data for line graphs
  const lineGraphData = [
    { day: "Mon", temperature: 28.4, salinity: 35.1, oxygen: 5.2 },
    { day: "Tue", temperature: 27.9, salinity: 34.8, oxygen: 5.1 },
    { day: "Wed", temperature: 27.2, salinity: 34.5, oxygen: 5.0 },
    { day: "Thu", temperature: 26.8, salinity: 34.2, oxygen: 4.9 },
    { day: "Fri", temperature: 26.3, salinity: 33.9, oxygen: 4.8 },
    { day: "Sat", temperature: 25.7, salinity: 33.6, oxygen: 4.7 },
    { day: "Sun", temperature: 25.2, salinity: 33.3, oxygen: 4.6 },
  ];

  // Current metric data for statistics panel
  const metricMap = {
    temperature: { data: lineGraphData.map(d => d.temperature), unit: "°C" },
    salinity: { data: lineGraphData.map(d => d.salinity), unit: "PSU" },
    oxygen: { data: lineGraphData.map(d => d.oxygen), unit: "ml/L" },
  };
  // Fallback to temperature stats if selectedChart is not a metric
  const currentData = metricMap[
    selectedChart === "compare" || selectedChart === "depth" || selectedChart === "events"
      ? "temperature"
      : selectedChart
  ];

  return (
    <div className="h-full space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
        <div className="lg:col-span-3 flex flex-col">
          {/* Chart Tabs */}
          <Tabs value={selectedChart} onValueChange={setSelectedChart} className="h-full flex flex-col">
            <TabsList className="flex gap-2 mb-2">
              <TabsTrigger value="temperature" className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 mr-2" />Temperature
              </TabsTrigger>
              <TabsTrigger value="salinity" className="flex items-center gap-2">
                <Droplet className="w-4 h-4 mr-2" />Salinity
              </TabsTrigger>
              <TabsTrigger value="oxygen" className="flex items-center gap-2">
                <Activity className="w-4 h-4 mr-2" />Oxygen
              </TabsTrigger>
              <TabsTrigger value="compare" className="flex items-center gap-2">
                Compare
              </TabsTrigger>
              <TabsTrigger value="depth" className="flex items-center gap-2">
                Depth Profile
              </TabsTrigger>
            </TabsList>
            {/* Temperature Chart Tab */}
            <TabsContent value="temperature" className="flex-1">
              <Card className="p-6 glass">
                <h3 className="text-lg font-semibold mb-2 flex items-center"><Thermometer className="w-5 h-5 mr-2 text-primary" />Temperature</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={lineGraphData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3344" />
                    <XAxis dataKey="day" stroke="#a3bffa" fontSize={12} />
                    <YAxis stroke="#a3bffa" fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="temperature" name="Temperature (°C)" stroke="#e57373" strokeWidth={2} dot={{r: 3}} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </TabsContent>
            {/* Depth Profile Chart Tab */}
            <TabsContent value="depth" className="flex-1">
              <Card className="p-6 glass">
                <h3 className="text-lg font-semibold mb-2 flex items-center">Depth Profile</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart
                    data={depthProfileData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3344" />
                    <XAxis
                      type="number"
                      dataKey="pressure"
                      domain={[1000, 0]}
                      stroke="#e57373"
                      fontSize={12}
                      reversed
                      allowDataOverflow={true}
                      label={{ value: "Pressure (dbar, reversed)", angle: 0, position: "insideBottom" }}
                    />
                    <YAxis
                      type="number"
                      domain={[0, 38]}
                      stroke="#a3bffa"
                      fontSize={12}
                      allowDataOverflow={true}
                      label={{ value: "Value", angle: -90, position: "insideLeft" }}
                    />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="temperature" name="Temperature (°C)" stroke="#e57373" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="salinity" name="Salinity (PSU)" stroke="#64b5f6" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="oxygen" name="Oxygen (ml/L)" stroke="#81c784" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="text-xs text-muted-foreground mt-2">
                  X-axis: Pressure (dbar, reversed). Y-axis: Temperature, Salinity, Oxygen.
                </div>
              </Card>
            </TabsContent>
            {/* Salinity Chart Tab */}
            <TabsContent value="salinity" className="flex-1">
              <Card className="p-6 glass">
                <h3 className="text-lg font-semibold mb-2 flex items-center"><Droplet className="w-5 h-5 mr-2 text-primary" />Salinity</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={lineGraphData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3344" />
                    <XAxis dataKey="day" stroke="#a3bffa" fontSize={12} />
                    <YAxis stroke="#a3bffa" fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="salinity" name="Salinity (PSU)" stroke="#64b5f6" strokeWidth={2} dot={{r: 3}} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </TabsContent>
            {/* Oxygen Chart Tab */}
            <TabsContent value="oxygen" className="flex-1">
              <Card className="p-6 glass">
                <h3 className="text-lg font-semibold mb-2 flex items-center"><Activity className="w-5 h-5 mr-2 text-primary" />Oxygen</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={lineGraphData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3344" />
                    <XAxis dataKey="day" stroke="#a3bffa" fontSize={12} />
                    <YAxis stroke="#a3bffa" fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="oxygen" name="Oxygen (ml/L)" stroke="#81c784" strokeWidth={2} dot={{r: 3}} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </TabsContent>
            {/* Compare Tab: Combined Chart with toggles */}
            <TabsContent value="compare" className="flex-1">
              <Card className="p-6 glass">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">Compare ARGO Floats</h3>
                  <div className="flex gap-2">
                    <Button variant={showTemperature ? "default" : "outline"} size="sm" onClick={() => setShowTemperature(v => !v)} className="glass ocean-transition"><Thermometer className="w-4 h-4 mr-1" />Temp</Button>
                    <Button variant={showSalinity ? "default" : "outline"} size="sm" onClick={() => setShowSalinity(v => !v)} className="glass ocean-transition"><Droplet className="w-4 h-4 mr-1" />Salinity</Button>
                    <Button variant={showOxygen ? "default" : "outline"} size="sm" onClick={() => setShowOxygen(v => !v)} className="glass ocean-transition"><Activity className="w-4 h-4 mr-1" />Oxygen</Button>
                  </div>
                </div>
                {comparisonData.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                      <span className="text-lg">📊</span>
                      <span className="text-sm font-medium">
                        Comparing {comparisonData.length} ARGO floats
                      </span>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={comparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a3344" />
                        <XAxis dataKey="id" stroke="#a3bffa" fontSize={12} />
                        <YAxis stroke="#a3bffa" fontSize={12} />
                        <Tooltip />
                        <Legend />
                        {showTemperature && <Bar dataKey="temperature" name="Temperature (°C)" fill="#e57373" />}
                        {showSalinity && <Bar dataKey="salinity" name="Salinity (PSU)" fill="#64b5f6" />}
                        {showOxygen && <Bar dataKey="oxygen" name="Oxygen (ml/L)" fill="#81c784" />}
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="text-sm text-muted-foreground">
                      Real-time data comparison from selected ARGO floats
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No comparison data available. Ask the AI to compare floats or select floats from the data table.</p>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        {/* Statistics Panel */}
        <div className="space-y-4">
          <Card className="p-4 glass">
            <h4 className="font-medium mb-3">Statistics</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Average:</span>
                <span className="data-glow">
                  {(currentData.data.reduce((a, b) => a + b, 0) / currentData.data.length).toFixed(1)} {currentData.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Maximum:</span>
                <span className="data-glow">
                  {Math.max(...currentData.data).toFixed(1)} {currentData.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Minimum:</span>
                <span className="data-glow">
                  {Math.min(...currentData.data).toFixed(1)} {currentData.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Range:</span>
                <span className="data-glow">
                  {(Math.max(...currentData.data) - Math.min(...currentData.data)).toFixed(1)} {currentData.unit}
                </span>
              </div>
            </div>
          </Card>
          <Card className="p-4 glass">
            <h4 className="font-medium mb-3">Depth Profile</h4>
            <div className="space-y-2">
              {[
                { depth: "0-50m", value: "28.4°C", color: "bg-destructive" },
                { depth: "50-200m", value: "24.1°C", color: "bg-primary" },
                { depth: "200-500m", value: "18.7°C", color: "bg-accent" },
                { depth: "500m+", value: "12.3°C", color: "bg-secondary" },
              ].map((layer, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${layer.color}`} />
                  <span className="text-xs text-muted-foreground flex-1">
                    {layer.depth}
                  </span>
                  <span className="text-xs font-mono data-glow">
                    {layer.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-4 glass">
            <h4 className="font-medium mb-3">Data Quality</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Accuracy:</span>
                <Badge variant="outline" className="bg-primary/20">
                  98.7%
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Coverage:</span>
                <Badge variant="outline" className="bg-accent/20">
                  95.2%
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last QC:</span>
                <span className="text-xs">2 hours ago</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}