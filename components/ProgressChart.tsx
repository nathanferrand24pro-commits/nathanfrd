"use client";

import { useMemo, useState } from "react";

export interface ProgressPoint {
  date: string; // ISO
  weight: number;
  reps: number;
}

const W = 560;
const H = 180;
const PAD = { top: 12, right: 16, bottom: 26, left: 44 };

// Courbe d'évolution de la meilleure charge par séance pour un exercice.
export function ProgressChart({ points }: { points: ProgressPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const { xs, ys, yTicks, yMin, yMax } = useMemo(() => {
    const weights = points.map((p) => p.weight);
    const rawMin = Math.min(...weights);
    const rawMax = Math.max(...weights);
    const span = rawMax - rawMin || 1;
    const yMin = Math.max(0, rawMin - span * 0.15);
    const yMax = rawMax + span * 0.15;

    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const xs = points.map((_, i) =>
      points.length === 1 ? PAD.left + innerW / 2 : PAD.left + (i / (points.length - 1)) * innerW
    );
    const ys = points.map(
      (p) => PAD.top + innerH - ((p.weight - yMin) / (yMax - yMin)) * innerH
    );

    const tickCount = 3;
    const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => yMin + ((yMax - yMin) * i) / tickCount);
    return { xs, ys, yTicks, yMin, yMax };
  }, [points]);

  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");

  function yFor(v: number) {
    const innerH = H - PAD.top - PAD.bottom;
    return PAD.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    for (let i = 1; i < xs.length; i++) {
      if (Math.abs(xs[i] - x) < Math.abs(xs[best] - x)) best = i;
    }
    setHover(best);
  }

  const h = hover !== null ? points[hover] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Évolution de la charge maximale par séance"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {/* Grille horizontale discrète + graduations */}
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
              {i === yTicks.length - 1 ? `${Math.round(t)} kg` : Math.round(t)}
            </text>
          </g>
        ))}

        {/* Dates première / dernière */}
        <text x={xs[0]} y={H - 8} textAnchor="start" fontSize={10} fill="#6e6e73">
          {fmtDate(points[0].date)}
        </text>
        {points.length > 1 && (
          <text x={xs[xs.length - 1]} y={H - 8} textAnchor="end" fontSize={10} fill="#6e6e73">
            {fmtDate(points[points.length - 1].date)}
          </text>
        )}

        {/* Ligne + points */}
        {points.length > 1 && (
          <path d={path} fill="none" stroke="#bf4800" strokeWidth={2} strokeLinejoin="round" />
        )}
        {xs.map((x, i) => (
          <circle
            key={i}
            cx={x}
            cy={ys[i]}
            r={hover === i ? 5 : 3.5}
            fill="#bf4800"
            stroke="#ffffff"
            strokeWidth={2}
          />
        ))}

        {/* Curseur de survol */}
        {hover !== null && (
          <line
            x1={xs[hover]}
            x2={xs[hover]}
            y1={PAD.top}
            y2={H - PAD.bottom}
            stroke="#bf4800"
            strokeOpacity={0.3}
            strokeWidth={1}
          />
        )}
      </svg>

      {h && hover !== null && (
        <div
          className="absolute pointer-events-none px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap"
          style={{
            left: `${(xs[hover] / W) * 100}%`,
            top: 0,
            transform: `translateX(${xs[hover] > W * 0.7 ? "-100%" : "8px"})`,
            background: "#1d1d1f",
            color: "#f5f5f7",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          <span className="font-semibold">{h.weight} kg</span> × {h.reps} rép. —{" "}
          {fmtDate(h.date)}
        </div>
      )}
    </div>
  );
}
