"use client";

import { useEffect, useRef } from "react";

interface BurstParticle {
  id: number;
  icon: { src: string; label: string };
  tx: number;
  ty: number;
  size: number;
  delay: number;
  rotation: number;
}

export function BurstIcon({ particle }: { particle: BurstParticle }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Start from center, animate out and fade
    const keyframes: Keyframe[] = [
      {
        transform: `translate(0, 0) scale(0.5) rotate(0deg)`,
        opacity: 0,
      },
      {
        transform: `translate(${particle.tx * 0.15}px, ${particle.ty * 0.15}px) scale(1.2) rotate(${particle.rotation * 0.3}deg)`,
        opacity: 1,
        offset: 0.15,
      },
      {
        transform: `translate(${particle.tx * 0.6}px, ${particle.ty * 0.6}px) scale(1) rotate(${particle.rotation * 0.7}deg)`,
        opacity: 0.8,
        offset: 0.5,
      },
      {
        transform: `translate(${particle.tx}px, ${particle.ty}px) scale(0.6) rotate(${particle.rotation}deg)`,
        opacity: 0,
      },
    ];

    el.animate(keyframes, {
      duration: 1600,
      delay: particle.delay * 1000,
      easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      fill: "forwards",
    });
  }, [particle]);

  return (
    <div
      ref={ref}
      className="absolute pointer-events-none"
      style={{
        width: `${particle.size}px`,
        height: `${particle.size}px`,
        left: `calc(50% - ${particle.size / 2}px)`,
        top: `calc(50% - ${particle.size / 2}px)`,
        opacity: 0,
        zIndex: 0,
      }}
    >
      <img
        src={particle.icon.src || "/placeholder.svg"}
        alt={particle.icon.label}
        width={particle.size}
        height={particle.size}
        className="w-full h-full object-contain drop-shadow-lg"
      />
    </div>
  );
}
