"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { KingIcon } from "./chess-icons";
import { Wifi, WifiOff } from "lucide-react";
import { BurstIcon } from "./burst-icon"; // Import BurstIcon

// Chess move classification icons from the user's images
const CLASSIFICATION_ICONS = [
  { src: "/images/brilliant.png", label: "Brilliant" },
  { src: "/images/best.png", label: "Best" },
  { src: "/images/great.png", label: "Great" },
  { src: "/images/good.png", label: "Good" },
  { src: "/images/decent.png", label: "Decent" },
  { src: "/images/teoretical.png", label: "Book" },
  { src: "/images/inaccuracy.png", label: "Inaccuracy" },
  { src: "/images/mistake.png", label: "Mistake" },
  { src: "/images/blunder.png", label: "Blunder" },
  { src: "/images/miss.png", label: "Miss" },
];

interface BurstParticle {
  id: number;
  icon: typeof CLASSIFICATION_ICONS[number];
  tx: number;
  ty: number;
  size: number;
  delay: number;
  rotation: number;
}

export function HomeScreen() {
  const [isActive, setIsActive] = useState(false);
  const [particles, setParticles] = useState<BurstParticle[]>([]);
  const [gameDetected, setGameDetected] = useState(true);
  const [rating, setRating] = useState(1247);
  const particleCounter = useRef(0);

  const emitParticles = useCallback(() => {
    const count = 1; // fewer particles at a time
    const newParticles: BurstParticle[] = [];

    for (let i = 0; i < count; i++) {
      const icon = CLASSIFICATION_ICONS[Math.floor(Math.random() * CLASSIFICATION_ICONS.length)];
      const angle = Math.random() * Math.PI * 2;
      const distance = 90 + Math.random() * 80;
      particleCounter.current += 1;
      newParticles.push({
        id: particleCounter.current,
        icon,
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance,
        size: 22 + Math.random() * 14,
        delay: 0,
        rotation: -180 + Math.random() * 360,
      });
    }

    setParticles((prev) => {
      // Cap at 30 concurrent particles for performance
      const combined = [...prev, ...newParticles];
      return combined.length > 30 ? combined.slice(-30) : combined;
    });

    // Clean up these particles after animation completes
    const ids = newParticles.map((p) => p.id);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !ids.includes(p.id)));
    }, 2000);
  }, []);

  // Continuous stream while active — small groups very frequently
  useEffect(() => {
    if (!isActive) return;
    emitParticles();
    const interval = setInterval(emitParticles, 240);
    return () => clearInterval(interval);
  }, [isActive, emitParticles]);

  const handleLaunch = () => {
    setIsActive((prev) => !prev);
  };

  // Floating ambient particles behind the button
  const [ambientDots, setAmbientDots] = useState<
    { id: number; x: number; y: number; size: number; duration: number; delay: number }[]
  >([]);

  useEffect(() => {
    const dots = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1.5 + Math.random() * 2.5,
      duration: 4 + Math.random() * 6,
      delay: Math.random() * 4,
    }));
    setAmbientDots(dots);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full relative px-6">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Radial glow behind button */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] w-[300px] h-[300px] rounded-full bg-primary/[0.04] blur-3xl" />

        {/* Floating ambient dots */}
        {ambientDots.map((dot) => (
          <div
            key={dot.id}
            className="absolute rounded-full bg-primary/20"
            style={{
              left: `${dot.x}%`,
              top: `${dot.y}%`,
              width: `${dot.size}px`,
              height: `${dot.size}px`,
              animation: `float ${dot.duration}s ease-in-out ${dot.delay}s infinite`,
            }}
          />
        ))}

        {/* Subtle grid lines */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(38 95% 56%) 1px, transparent 1px),
              linear-gradient(90deg, hsl(38 95% 56%) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Logo + title */}
      <div className="flex flex-col items-center gap-1 mb-8 animate-fade-in-up relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center border border-primary/20">
            <KingIcon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground tracking-tight leading-none">
              lineMaster
            </span>
            <span className="text-[9px] text-primary/70 tracking-[0.2em] uppercase font-medium">
              Opening Theory Bot
            </span>
          </div>
        </div>
      </div>

      {/* Main launch button area */}
      <div className="relative flex items-center justify-center mb-10">
        {/* Animated rings behind button */}
        <div
          className={cn(
            "absolute w-[180px] h-[180px] rounded-full border border-primary/15 animate-pulse-ring",
            isActive && "border-accent/20"
          )}
        />
        <div
          className={cn(
            "absolute w-[210px] h-[210px] rounded-full border border-primary/8 animate-pulse-ring-2",
            isActive && "border-accent/12"
          )}
        />

        {/* Spinning decorative ring */}
        <div className="absolute w-[160px] h-[160px] animate-spin-slow">
          <svg width="160" height="160" viewBox="0 0 160 160" fill="none" className="opacity-10">
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30 * Math.PI) / 180;
              const x = Math.round(80 + 74 * Math.cos(angle));
              const y = Math.round(80 + 74 * Math.sin(angle));
              return (
                <circle
                  key={`ring-dot-${i}`}
                  cx={x}
                  cy={y}
                  r={i % 3 === 0 ? 2.5 : 1.5}
                  fill="hsl(38 95% 56%)"
                />
              );
            })}
          </svg>
        </div>

        {/* Burst particles — z-0 so they appear behind the button */}
        <div className="absolute left-1/2 top-1/2 z-0 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div
            className="relative h-full w-full"
            style={{
              WebkitMaskImage:
                "radial-gradient(circle at center, transparent 0 72px, black 78px)",
              maskImage:
                "radial-gradient(circle at center, transparent 0 72px, black 78px)",
            }}
          >
            {particles.map((p) => (
              <BurstIcon key={p.id} particle={p} />
            ))}
          </div>
        </div>

        {/* The button itself */}
        <button
          type="button"
          onClick={handleLaunch}
          className={cn(
            "relative w-[130px] h-[130px] rounded-full flex flex-col items-center justify-center gap-2 transition-all duration-500 group cursor-pointer select-none z-10",
            isActive
              ? "bg-accent/20 border-2 border-accent/50 shadow-[0_0_40px_-8px_hsl(168_60%_48%/0.4)]"
              : "bg-primary/10 border-2 border-primary/30 animate-glow-breathe hover:border-primary/50 hover:bg-primary/15"
          )}
        >
          {/* Inner glow */}
          <div
            className={cn(
              "absolute inset-2 rounded-full transition-all duration-500",
              isActive
                ? "bg-accent/10 shadow-inner"
                : "bg-primary/5 shadow-inner group-hover:bg-primary/8"
            )}
          />
          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                isActive ? "text-accent scale-110" : "text-primary group-hover:scale-105"
              )}
            >
              {isActive ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5.14v14l11-7-11-7z" />
                </svg>
              )}
            </div>
            <span
              className={cn(
                "text-[11px] font-bold tracking-wide uppercase transition-colors",
                isActive ? "text-accent" : "text-primary"
              )}
            >
              {isActive ? "Активен" : "Запустить"}
            </span>
          </div>
        </button>
      </div>

      {/* Status indicators */}
      <div className="flex flex-col items-center gap-3 animate-fade-in-up relative z-10" style={{ animationDelay: '0.1s' }}>
        {/* Game detection status */}
        <div
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full border transition-all",
            gameDetected
              ? "bg-accent/8 border-accent/20 text-accent"
              : "bg-destructive/8 border-destructive/20 text-destructive"
          )}
        >
          <div className="relative">
            {gameDetected ? (
              <Wifi className="w-3.5 h-3.5" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" />
            )}
            {gameDetected && (
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent animate-status-dot" />
            )}
          </div>
          <span className="text-xs font-medium">
            {gameDetected ? "Игра обнаружена" : "Игра не обнаружена"}
          </span>
        </div>

        {/* Rating display */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-card border border-border/50">
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Рейтинг</span>
            <span className="text-xl font-bold font-mono text-foreground tabular-nums">{rating}</span>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Диапазон</span>
            <span className="text-xs font-semibold text-primary">1000-1300</span>
          </div>
        </div>
      </div>
    </div>
  );
}
