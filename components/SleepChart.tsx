"use client";

import { useState } from "react";

export interface SleepPoint {
  date: string; // ISO
  durationMin: number;
}

const W = 560;
const H = 180;
const PAD = { top: 14, right: 12, bottom: 26, left: 40 };
const TARGET_MIN = 8 * 60; // objectif Huberman : ~8 h par nuit

// Barres de durée de sommeil par nuit (ordre chronologique), repère à 8 h.
export function SleepChart({ points }: { points: SleepPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);

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
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Durée de sommeil par nuit"
        onMouseLeave={() => setHover(null)}
      >
        {yTicks.map((t, i) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={yFor(t)}
              y2={yFor(t)}
              stroke="#e8e8ed"
              strokeWidth={1}
            />
            <text x={PAD.left - 6} y={yFor(t) + 3.5} textAnchor="end" fontSize={10} fill="#6e6e73">
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
          stroke="#6e6e73"
          strokeWidth={1}
          strokeDasharray="4 3"
        />

        {points.map((p, i) => {
          const x = PAD.left + i * slot + (slot - barW) / 2;
          const y = yFor(p.durationMin);
          return (
            <g key={p.date}>
              {/* Zone de survol plus large que la barre */}
              <rect
                x={PAD.left + i * slot}
                y={PAD.top}
                width={slot}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
              />
              <rect
                x={x}
                y={y}
                width={barW}
                height={PAD.top + innerH - y}
                rx={4}
                fill="#bf4800"
                opacity={hover === null || hover === i ? 1 : 0.45}
              />
            </g>
          );
        })}

        {/* Dates première / dernière */}
        <text x={PAD.left} y={H - 8} textAnchor="start" fontSize={10} fill="#6e6e73">
          {fmtDate(points[0].date)}
        </text>
        {points.length > 1 && (
          <text x={W - PAD.right} y={H - 8} textAnchor="end" fontSize={10} fill="#6e6e73">
            {fmtDate(points[points.length - 1].date)}
          </text>
        )}
      </svg>

      {hover !== null && (
        <div
          className="absolute pointer-events-none px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap"
          style={{
            left: `${((PAD.left + hover * slot + slot / 2) / W) * 100}%`,
            top: 0,
            transform: `translateX(${hover > points.length * 0.7 ? "-100%" : "8px"})`,
            background: "#1d1d1f",
            color: "#f5f5f7",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          <span className="font-semibold">{hours(points[hover].durationMin)}</span> —{" "}
          {fmtDate(points[hover].date)}
        </div>
      )}
    </div>
  );
}
