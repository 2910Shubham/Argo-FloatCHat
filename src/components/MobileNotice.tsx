"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function MobileNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="md:hidden fixed inset-0 z-[3000] bg-background/90 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="max-w-sm w-full glass p-5 text-center space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Desktop Recommended</h2>
          <p className="text-sm text-muted-foreground">
            This app contains a scientific dashboard optimized for larger screens. Please open it on a desktop for the best experience.
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full ocean-transition"
          onClick={() => setVisible(false)}
        >
          Continue on Mobile
        </Button>
      </div>
    </div>
  );
}
