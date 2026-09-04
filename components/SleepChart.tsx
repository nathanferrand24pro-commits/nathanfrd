"use client";

import { useEffect, useRef, useState } from "react";

export interface SleepPoint {
  date: string; // ISO
  durationMin: number;
}

const W = 560;
const H = 180;
const PAD = { top: 14, right: 12, bottom: 26, left: 40 };
const TARGET_MIN = 8 * 60; // objectif Huberman : ~8 h par nuit

// Barres de durée de sommeil par nuit (ordre chronologique), repère à 8 h.
// Tooltip utilisable au doigt : un tap sur une barre le fixe, un tap ailleurs le ferme.
export function SleepChart({ points }: { points: SleepPoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [pinned, setPinned] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Tap en dehors du graphique : ferme le tooltip fixé.
  useEffect(() => {
    if (!pinned) return;
    const close = (e: Event) => {
      const el = containerRef.current;
      if (el && e.target instanceof Node && el.contains(e.target)) return;
      setPinned(false);
      setActive(null);
    };
    document.addEventListener("click", close);
    document.addEventListener("touchstart", close);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("touchstart", close);
    };
  }, [pinned]);

  const pin = (i: number) => {
    setActive(i);
    setPinned(true);
  };

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const maxMin = Math.max(TARGET_MIN, ...points.map((p) => p.durationMin)) * 1.1;

  const slot = innerW / points.length;
  const barW = Math.min(28, slot - 2); // 2px d'écart entre barres adjacentes

  const yFor = (min: number) => PAD.top + innerH - (min / maxMin) * innerH;

  const hours = (min: number) => `${Math.floor(min / 60)}h${String(min % 60).padStart(2, "0")}`;
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });

  const yTicks = [0, 4 * 60, 8 * 60];

  return (
    <div className="relative" ref={containerRef}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Durée de sommeil par nuit"
        onMouseLeave={() => {
          if (!pinned) setActive(null);
        }}
        onClick={() => {
          // Tap sur le fond du graphique (hors zones de barre) : ferme le tooltip.
          setPinned(false);
          setActive(null);
        }}
      >
        {yTicks.map((t, i) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={yFor(t)}
              y2={yFor(t)}
              stroke="var(--fit-grid)"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 6}
              y={yFor(t) + 3.5}
              textAnchor="end"
              fontSize={10}
              fill="var(--fit-ink-3)"
            >
              {i === yTicks.length - 1 ? `${t / 60} h` : t / 60}
            </text>
          </g>
        ))}

        {/* Repère objectif 8 h */}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={yFor(TARGET_MIN)}
          y2={yFor(TARGET_MIN)}
          stroke="var(--fit-ink-2)"
          strokeWidth={1}
          strokeDasharray="4 3"
        />

        {points.map((p, i) => {
          const x = PAD.left + i * slot + (slot - barW) / 2;
          const y = yFor(p.durationMin);
          return (
            <g key={p.date}>
              {/* Zone de survol/tap plus large que la barre */}
              <rect
                x={PAD.left + i * slot}
                y={PAD.top}
                width={slot}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => {
                  if (!pinned) setActive(i);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  pin(i);
                }}
                onTouchStart={() => pin(i)}
              />
              <rect
                x={x}
                y={y}
                width={barW}
                height={PAD.top + innerH - y}
                rx={4}
                fill="var(--fit-accent)"
                opacity={active === null || active === i ? 1 : 0.45}
                style={{ pointerEvents: "none" }}
              />
            </g>
          );
        })}

        {/* Dates première / dernière */}
        <text x={PAD.left} y={H - 8} textAnchor="start" fontSize={10} fill="var(--fit-ink-3)">
          {fmtDate(points[0].date)}
        </text>
        {points.length > 1 && (
          <text x={W - PAD.right} y={H - 8} textAnchor="end" fontSize={10} fill="var(--fit-ink-3)">
            {fmtDate(points[points.length - 1].date)}
          </text>
        )}
      </svg>

      {active !== null && (
        <div
          className="absolute pointer-events-none px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap"
          style={{
            left: `${((PAD.left + active * slot + slot / 2) / W) * 100}%`,
            top: 0,
            transform: `translateX(${active > points.length * 0.7 ? "-100%" : "8px"})`,
            background: "#1c1e1d",
            color: "#f5f5f7",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          <span className="font-semibold">{hours(points[active].durationMin)}</span> —{" "}
          {fmtDate(points[active].date)}
        </div>
      )}
    </div>
  );
}
