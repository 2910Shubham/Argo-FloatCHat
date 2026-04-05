"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const defaultQuery = `https://argovis-api.colorado.edu/argo?id=2901283&n=1&order=desc&data=all`;

export default function Developer() {
  const [endpoint, setEndpoint] = useState(defaultQuery);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string>("");
  const [error, setError] = useState<string>("");
  const presets: Array<{ label: string; url: string; desc?: string }> = [
    { label: "Latest by WMO (n=1)", url: "https://argovis-api.colorado.edu/argo?id=2901283&n=1&order=desc&data=all", desc: "Most recent profile for a platform" },
    { label: "BBox last 7 days", url: "https://argovis-api.colorado.edu/argo?startDate=now-7day&endDate=now&minLat=-10&maxLat=30&minLon=40&maxLon=100&data=all", desc: "Geo/time filter" },
    { label: "Recent Arabian Sea", url: "https://argovis-api.colorado.edu/argo?startDate=now-14day&endDate=now&minLat=5&maxLat=25&minLon=50&maxLon=75&data=all", desc: "Regional subset" },
    { label: "BGC only (oxygen)", url: "https://argovis-api.colorado.edu/argo?startDate=now-30day&endDate=now&parameter=DOXY&data=all", desc: "Biogeochemical variable" },
    { label: "Count only", url: "https://argovis-api.colorado.edu/argo?startDate=now-7day&endDate=now&select=count", desc: "Aggregate count" },
  ];

  const runQuery = async () => {
    setLoading(true);
    setError("");
    setResponse("");
    try {
      const res = await fetch(endpoint);
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResponse(text);
    } catch (e: any) {
      setError(e?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const curlSnippet = `curl -s "${endpoint}"`;

  return (
    <div className="h-screen overflow-y-auto scrollbar-custom p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Developer / API</h1>
          <p className="text-sm text-muted-foreground"> quickstart and live Try-It for Argovis findArgo-style queries</p>
        </div>
        <Badge variant="outline">Public Beta</Badge>
      </div>

      <Card className="p-5 glass space-y-4">
        <h2 className="text-lg font-semibold">Quickstart</h2>
        <div className="text-sm space-y-2">
          {/* <p>
            FloatChat integrates ARGO data from Argovis. You can try requests similar to <code>findArgo</code> here and see JSON responses.
            See Argovis docs for parameters and filters.
          </p> */}
          <a className="text-xs underline opacity-80" href="https://argovis-api.colorado.edu/docs/#/argo/findArgo" target="_blank" rel="noreferrer">Argovis API: findArgo</a>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 glass space-y-3 md:col-span-1 sticky top-4 max-h-[calc(100vh-6rem)] overflow-auto scrollbar-custom">
          <h2 className="text-lg font-semibold">APIs</h2>
          <div className="space-y-2">
            {presets.map((p, i) => (
              <div key={i} className="p-3 rounded-lg border border-border/60 hover:bg-background/40 ocean-transition">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold">{p.label}</div>
                    {p.desc && <div className="text-[11px] opacity-70">{p.desc}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => { setEndpoint(p.url); runQuery(); }}>Try</Button>
                    <Button size="sm" variant="outline" onClick={() => window.open(p.url, "_blank")}>Open</Button>
                  </div>
                </div>
                <div className="mt-2 text-[11px] break-all opacity-80 font-mono">{p.url}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5 glass space-y-4 md:col-span-2">
          <h2 className="text-lg font-semibold">Try it</h2>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">HTTP GET URL</label>
            <Input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="https://argovis-api.colorado.edu/argo?..." />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={runQuery} disabled={loading}>{loading ? "Running..." : "Run"}</Button>
            <Button variant="outline" onClick={() => setEndpoint(defaultQuery)}>Reset</Button>
            <Button variant="outline" onClick={() => window.open(endpoint, "_blank")}>Open in new tab</Button>
          </div>
          <Separator />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4 bg-background/40 border-border/60">
              <h3 className="text-sm font-medium mb-2">cURL</h3>
              <Textarea className="h-28 font-mono text-xs" readOnly value={curlSnippet} />
            </Card>
            <Card className="p-4 bg-background/40 border-border/60">
              <h3 className="text-sm font-medium mb-2">Response</h3>
              {error ? (
                <div className="text-xs text-red-400">{error}</div>
              ) : (
                <Textarea className="h-64 font-mono text-xs scrollbar-custom" readOnly value={response} />
              )}
            </Card>
          </div>
        </Card>
      </div>

      <Card className="p-5 glass space-y-4">
        <h2 className="text-lg font-semibold">Examples</h2>
        <div className="text-xs space-y-2">
          <div>
            Latest profile for a platform:
            <pre className="mt-1 p-2 bg-background/40 rounded border border-border/60 overflow-x-auto whitespace-pre-wrap break-all">https://argovis-api.colorado.edu/argo?id=2901283&n=1&order=desc&data=all</pre>
          </div>
          <div>
            Last 7 days in a bbox:
            <pre className="mt-1 p-2 bg-background/40 rounded border border-border/60 overflow-x-auto whitespace-pre-wrap break-all">https://argovis-api.colorado.edu/argo?startDate=now-7day&endDate=now&minLat=-10&maxLat=30&minLon=40&maxLon=100&data=all</pre>
          </div>
          <div>
            <span className="text-red-500 italic mt-1">*NOTE:</span>
            <pre className="rounded border border-border/60 overflow-x-auto  break-all">This is a prototype application. The API links shown here are not generated or maintained by us, and they may or may not work. Please use these endpoints for testing purposes only.</pre>
          </div>
        </div>
      </Card>
    </div>
  );
}


