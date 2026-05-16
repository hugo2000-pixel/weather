"use client";

import { useEffect, useRef } from "react";
import { getWeatherState } from "@/lib/constants/wmo-codes";

interface AmbientCanvasProps {
  weatherCode: number;
  isDay: boolean;
}

export function AmbientCanvas({ weatherCode, isDay }: AmbientCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const particles: Array<{ x: number; y: number; vy: number; vx: number; size: number; opacity: number }> = [];
    const state = getWeatherState(weatherCode);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener("resize", resize);
    resize();

    // Init particles based on weather
    const particleCount = state.label.toLowerCase().includes("rain") || state.label.toLowerCase().includes("drizzle") ? 100 : 
                         state.label.toLowerCase().includes("snow") ? 150 : 0;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vy: state.label.toLowerCase().includes("snow") ? 0.5 + Math.random() * 1 : 10 + Math.random() * 10,
        vx: Math.random() * 2 - 1,
        size: state.label.toLowerCase().includes("snow") ? 2 + Math.random() * 3 : 1 + Math.random() * 1,
        opacity: 0.1 + Math.random() * 0.3,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      if (isDay) {
        if (state.label.toLowerCase().includes("clear") || state.label.toLowerCase().includes("sun")) {
          gradient.addColorStop(0, "#87CEEB");
          gradient.addColorStop(1, "#E0F7FA");
        } else {
          gradient.addColorStop(0, "#B0BEC5");
          gradient.addColorStop(1, "#ECEFF1");
        }
      } else {
        gradient.addColorStop(0, "#1A237E");
        gradient.addColorStop(1, "#000000");
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw particles
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      particles.forEach((p) => {
        ctx.beginPath();
        if (state.label.toLowerCase().includes("snow")) {
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        } else {
          ctx.rect(p.x, p.y, 1, p.vy / 2);
        }
        ctx.fill();

        p.y += p.vy;
        p.x += p.vx;

        if (p.y > height) p.y = -20;
        if (p.x > width) p.x = 0;
        if (p.x < 0) p.x = width;
      });

      // Mist / Fog effect
      if (state.label.toLowerCase().includes("fog") || state.label.toLowerCase().includes("mist")) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fillRect(0, 0, width, height);
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [weatherCode, isDay]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none opacity-40 transition-opacity duration-1000"
      aria-hidden="true"
    />
  );
}
