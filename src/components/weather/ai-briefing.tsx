"use client";

import { useState, useEffect, useCallback } from "react";
import { generateBriefing, type BriefingContext } from "@/lib/features/briefing/generate";
import { useSettings } from "@/lib/hooks/use-settings";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";

interface AiBriefingProps {
  ctx: BriefingContext;
}

const STORAGE_KEY = "weather-app:briefing:v1";

type StoredBriefing = {
  text: string;
  date: string; // YYYY-MM-DD
  location: string;
};

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0]!;
}

function loadCached(location: string): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const stored: StoredBriefing = JSON.parse(raw) as StoredBriefing;
    if (stored.date === getTodayKey() && stored.location === location) {
      return stored.text;
    }
  } catch {
    // ignore
  }
  return null;
}

function saveToCache(text: string, location: string): void {
  const stored: StoredBriefing = { text, date: getTodayKey(), location };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

export function AiBriefing({ ctx }: AiBriefingProps) {
  const { anthropicApiKey } = useSettings();
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (force = false) => {
      if (!anthropicApiKey) {
        setError("Add your Anthropic API key in Settings to enable AI Briefing.");
        return;
      }
      // Check daily cache
      if (!force) {
        const cached = loadCached(ctx.location);
        if (cached) {
          setText(cached);
          return;
        }
      }
      setLoading(true);
      setError(null);
      try {
        const result = await generateBriefing(ctx, anthropicApiKey);
        setText(result);
        saveToCache(result, ctx.location);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to generate briefing.");
      } finally {
        setLoading(false);
      }
    },
    [anthropicApiKey, ctx]
  );

  // Auto-generate once when component mounts (respects daily cache)
  useEffect(() => {
    if (anthropicApiKey) void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anthropicApiKey, ctx.location]);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" aria-hidden />
            <p className="text-sm font-semibold">AI Morning Briefing</p>
          </div>
          {text && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => void generate(true)}
              disabled={loading}
              aria-label="Refresh briefing"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} aria-hidden />
            </Button>
          )}
        </div>

        {!anthropicApiKey && (
          <p className="text-xs text-muted-foreground">
            Add your Anthropic API key in <span className="font-semibold">Settings</span> to get a personalised daily briefing.
          </p>
        )}

        {loading && (
          <div className="flex flex-col gap-2">
            <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-3 w-full rounded bg-muted animate-pulse" />
            <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
            <p>{error}</p>
          </div>
        )}

        {text && !loading && (
          <p className="text-sm leading-relaxed text-foreground/90">{text}</p>
        )}

        {!text && !loading && !error && anthropicApiKey && (
          <Button variant="outline" size="sm" onClick={() => void generate()} className="self-start">
            Generate Briefing
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
