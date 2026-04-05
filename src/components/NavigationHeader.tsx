import { Waves, Filter, User, HelpCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import floatchatLogo from "@/assets/floatchat-logo.png";

export function NavigationHeader() {
  return (
    <header className="h-16 border-b border-border glass backdrop-blur-xl">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left - Branding */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <img src={floatchatLogo.src} alt="FloatChat" className="w-8 h-8 animate-float" />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                FloatChat
              </h1>
              <p className="text-xs text-muted-foreground">AI Ocean Data Discovery</p>
            </div>
          </div>
          
          <Badge variant="secondary" className="glass animate-pulse-glow">
            <Waves className="w-3 h-3 mr-1" />
            ARGO Active
          </Badge>
        </div>

        {/* Center - Quick Filters */}
        <div className="hidden md:flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="glass ocean-transition">
            <Link href="/" aria-label="Go to home">
              <Filter className="w-4 h-4 mr-2" />
              Indian Ocean
            </Link>
          </Button>
          {/* <Button variant="outline" size="sm" className="glass ocean-transition">
            Last 30 Days
          </Button>
          <Button variant="outline" size="sm" className="glass ocean-transition">
            BGC Floats
          </Button> */}
        </div>

        {/* Right - User Actions */}
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="ocean-transition">
            <Link href="/about" aria-label="About FloatChat">
              <HelpCircle className="w-4 h-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="ocean-transition">
            <User className="w-4 h-4" />
          </Button>
          
          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground ml-4">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow"></div>
            <span>INCOIS Connected</span>
          </div>
        </div>
      </div>
    </header>
  );
}
