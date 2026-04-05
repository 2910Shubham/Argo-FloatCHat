import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { NavigationHeader } from "@/components/NavigationHeader";
import { AlertTriangle, BarChart3, Code2, Map, MessageSquare, Table, ArrowLeft } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="h-screen flex flex-col bg-background">
      <NavigationHeader />
      <main className="flex-1 overflow-y-auto scrollbar-custom">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">About FloatChat</h1>
                <Badge variant="secondary" className="glass">Beta</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                FloatChat is an AI-assisted explorer for ARGO ocean float data with a focus on the Indian Ocean.
                It combines a conversational interface with map, charts, and tables so you can move from a question
                to a data-backed view in seconds.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="ocean-transition">
                <Link href="/">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Explorer
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="ocean-transition">
                <Link href="/developer" target="_blank" rel="noreferrer">
                  <Code2 className="w-4 h-4" />
                  Developer/API
                </Link>
              </Button>
            </div>
          </div>

          <Card className="p-5 glass space-y-3">
            <h2 className="text-lg font-semibold">What This App Does</h2>
            <p className="text-sm text-muted-foreground">
              FloatChat pulls recent ARGO profiles from public oceanographic data services and wraps them in a
              focused workflow: ask questions, see where floats are, compare parameters, and track anomalies such as
              low-oxygen events or salinity drops. It is designed for quick exploration and decision support rather
              than heavy analysis pipelines.
            </p>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 glass space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <h3 className="text-base font-semibold">Conversational Search</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Ask natural language questions and get guided, oceanography-aware answers with contextual data.
              </p>
            </Card>
            <Card className="p-5 glass space-y-3">
              <div className="flex items-center gap-2">
                <Map className="w-4 h-4 text-primary" />
                <h3 className="text-base font-semibold">Spatial Discovery</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Explore float positions on a map and jump to key regions such as the Arabian Sea or Bay of Bengal.
              </p>
            </Card>
            <Card className="p-5 glass space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h3 className="text-base font-semibold">Charts & Tables</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Compare temperature, salinity, oxygen, and depth snapshots in both visual and tabular formats.
              </p>
            </Card>
          </div>

          <Card className="p-5 glass space-y-4">
            <h2 className="text-lg font-semibold">How To Use</h2>
            <Separator />
            <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
              <li>Type a question in the chat panel or tap a suggestion to get started.</li>
              <li>Use location names like “Mumbai” or “Bay of Bengal” to zoom the map to nearby floats.</li>
              <li>Ask to “compare” to generate quick comparisons across recent float profiles.</li>
              <li>Switch between Map, Charts, and Data Table tabs for different views of the same data.</li>
              <li>Open the Events button to review anomaly detections such as low oxygen or salinity drops.</li>
              <li>Use the Developer/API page to experiment with raw Argovis endpoints.</li>
            </ul>
          </Card>

          <Card className="p-5 glass space-y-4">
            <h2 className="text-lg font-semibold">Usage & Best Fit</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-accent" />
                  <h3 className="text-sm font-semibold">Great For</h3>
                </div>
                <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
                  <li>Rapid situational awareness of Indian Ocean float activity.</li>
                  <li>Educational demos and oceanography storytelling.</li>
                  <li>Early signal checks for salinity or oxygen anomalies.</li>
                  <li>Quick comparison of recent float snapshots across regions.</li>
                </ul>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold">Not A Replacement For</h3>
                </div>
                <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
                  <li>Full scientific workflows or quality-controlled research pipelines.</li>
                  <li>Regulatory or operational decision-making without validation.</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
