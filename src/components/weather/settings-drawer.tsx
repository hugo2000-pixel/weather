"use client";

import { useSettings } from "@/lib/hooks/use-settings";
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function SettingsDrawer() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const {
    tempUnit, windUnit, precipUnit, anthropicApiKey,
    setTempUnit, setWindUnit, setPrecipUnit, setAnthropicApiKey,
  } = useSettings();

  // Track local API key input separately so we don't save on every keystroke
  const [keyInput, setKeyInput] = useState(anthropicApiKey);

  useEffect(() => {
    setMounted(true);
    setKeyInput(anthropicApiKey);
  }, [anthropicApiKey]);

  if (!mounted) return null;

  return (
    <Sheet>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="rounded-full" />}
      >
        <Settings className="w-5 h-5" aria-hidden />
        <span className="sr-only">Open settings</span>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-8 mt-8">

          {/* Appearance */}
          <section className="space-y-3">
            <h4 className="font-semibold text-xs tracking-widest uppercase text-muted-foreground">Appearance</h4>
            <div className="flex items-center gap-2">
              <Button variant={theme === "light" ? "default" : "outline"} onClick={() => setTheme("light")} className="w-full flex gap-2">
                <Sun className="w-4 h-4" aria-hidden /> Light
              </Button>
              <Button variant={theme === "dark" ? "default" : "outline"} onClick={() => setTheme("dark")} className="w-full flex gap-2">
                <Moon className="w-4 h-4" aria-hidden /> Dark
              </Button>
            </div>
          </section>

          {/* Units */}
          <section className="space-y-4">
            <h4 className="font-semibold text-xs tracking-widest uppercase text-muted-foreground">Units</h4>

            <div className="space-y-2">
              <label className="text-sm font-medium">Temperature</label>
              <div className="flex gap-2">
                <Button variant={tempUnit === "celsius" ? "default" : "outline"} onClick={() => setTempUnit("celsius")} className="w-full">°C</Button>
                <Button variant={tempUnit === "fahrenheit" ? "default" : "outline"} onClick={() => setTempUnit("fahrenheit")} className="w-full">°F</Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Wind Speed</label>
              <div className="flex gap-2">
                <Button variant={windUnit === "kmh" ? "default" : "outline"} onClick={() => setWindUnit("kmh")} className="w-full">km/h</Button>
                <Button variant={windUnit === "mph" ? "default" : "outline"} onClick={() => setWindUnit("mph")} className="w-full">mph</Button>
                <Button variant={windUnit === "ms" ? "default" : "outline"} onClick={() => setWindUnit("ms")} className="w-full">m/s</Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Precipitation</label>
              <div className="flex gap-2">
                <Button variant={precipUnit === "mm" ? "default" : "outline"} onClick={() => setPrecipUnit("mm")} className="w-full">mm</Button>
                <Button variant={precipUnit === "inch" ? "default" : "outline"} onClick={() => setPrecipUnit("inch")} className="w-full">inch</Button>
              </div>
            </div>
          </section>

          {/* AI Briefing */}
          <section className="space-y-3">
            <h4 className="font-semibold text-xs tracking-widest uppercase text-muted-foreground">AI Briefing</h4>
            <p className="text-xs text-muted-foreground">
              Provide your own Anthropic API key to enable the daily AI morning briefing. Your key is stored only in your browser.
            </p>
            <Input
              type="password"
              placeholder="sk-ant-..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              aria-label="Anthropic API key"
            />
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setAnthropicApiKey(keyInput)}
            >
              Save Key
            </Button>
          </section>

        </div>
      </SheetContent>
    </Sheet>
  );
}
