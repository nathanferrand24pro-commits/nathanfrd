"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface ProgressPoint {
  date: string; // ISO
  weight: number;
  reps: number;
}

export interface BodyWeightPoint {
  date: string; // ISO
  weightKg: number;
}

const W = 560;
const H = 180;
const PAD = { top: 12, right: 16, bottom: 26, left: 44 };
const DAY_MS = 86_400_000;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function fmtKg(v: number) {
  return v.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
}

function buildYScale(values: number[], padFraction: number) {
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const span = rawMax - rawMin || 1;
  const yMin = Math.max(0, rawMin - span * padFraction);
  const yMax = rawMax + span * padFraction;
  const innerH = H - PAD.top - PAD.bottom;
  const yFor = (v: number) => PAD.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;
  const tickCount = 3;
  const yTicks = Array.from(
    { length: tickCount + 1 },
    (_, i) => yMin + ((yMax - yMin) * i) / tickCount
  );
  return { yFor, yTicks };
}

// Survol souris + tap tactile : un tap fixe le tooltip sur le point le plus
// proche, un tap sur le même point (ou en dehors du graphique) le ferme.
function useChartInteraction(xs: number[]) {
  const [active, setActive] = useState<number | null>(null);
  const [pinned, setPinned] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pinned) return;
    function onDocPointerDown(e: PointerEvent) {
      const el = containerRef.current;
      if (el && !el.contains(e.target as Node)) {
        setPinned(false);
        setActive(null);
      }
    }
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, [pinned]);

  function nearest(clientX: number, el: SVGSVGElement) {
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    let best = 0;
    for (let i = 1; i < xs.length; i++) {
      if (Math.abs(xs[i] - x) < Math.abs(xs[best] - x)) best = i;
    }
    return best;
  }

  const svgProps = {
    onMouseMove(e: React.MouseEvent<SVGSVGElement>) {
      if (pinned) return;
      setActive(nearest(e.clientX, e.currentTarget));
    },
    onMouseLeave() {
      if (!pinned) setActive(null);
    },
    onClick(e: React.MouseEvent<SVGSVGElement>) {
      const i = nearest(e.clientX, e.currentTarget);
      if (pinned && active === i) {
        setPinned(false);
        setActive(null);
      } else {
        setPinned(true);
        setActive(i);
      }
    },
    style: { touchAction: "manipulation" as const },
  };

  return { active, containerRef, svgProps };
}

function GridAndTicks({
  yTicks,
  yFor,
}: {
  yTicks: number[];
  yFor: (v: number) => number;
}) {
  return (
    <>
      {yTicks.map((t, i) => (
        <g key={i}>
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
            {i === yTicks.length - 1 ? `${fmtKg(t)} kg` : fmtKg(t)}
          </text>
        </g>
      ))}
    </>
  );
}

function ChartTooltip({ x, children }: { x: number; children: React.ReactNode }) {
  return (
    <div
      className="absolute pointer-events-none px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap"
      style={{
        left: `${(x / W) * 100}%`,
        top: 0,
        transform: `translateX(${x > W * 0.7 ? "-100%" : "8px"})`,
        background: "#1c1e1d",
        color: "#f5f5f7",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      }}
    >
      {children}
    </div>
  );
}

// Courbe d'évolution de la meilleure charge par séance pour un exercice.
export function ProgressChart({ points }: { points: ProgressPoint[] }) {
  const { xs, ys, yTicks, yFor } = useMemo(() => {
    const { yFor, yTicks } = buildYScale(
      points.map((p) => p.weight),
      0.15
    );
    const innerW = W - PAD.left - PAD.right;
    const xs = points.map((_, i) =>
      points.length === 1 ? PAD.left + innerW / 2 : PAD.left + (i / (points.length - 1)) * innerW
    );
    const ys = points.map((p) => yFor(p.weight));
    return { xs, ys, yTicks, yFor };
  }, [points]);

  const { active, containerRef, svgProps } = useChartInteraction(xs);

  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  const a = active !== null ? points[active] : null;

  return (
    <div className="relative" ref={containerRef}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Évolution de la charge maximale par séance"
        {...svgProps}
      >
        <GridAndTicks yTicks={yTicks} yFor={yFor} />

        {/* Dates première / dernière */}
        <text x={xs[0]} y={H - 8} textAnchor="start" fontSize={10} fill="var(--fit-ink-3)">
          {fmtDate(points[0].date)}
        </text>
        {points.length > 1 && (
          <text
            x={xs[xs.length - 1]}
            y={H - 8}
            textAnchor="end"
            fontSize={10}
            fill="var(--fit-ink-3)"
          >
            {fmtDate(points[points.length - 1].date)}
          </text>
        )}

        {/* Ligne + points */}
        {points.length > 1 && (
          <path
            d={path}
            fill="none"
            stroke="var(--fit-accent)"
            strokeWidth={2}
            strokeLinejoin="round"
          />
        )}
        {xs.map((x, i) => (
          <circle
            key={i}
            cx={x}
            cy={ys[i]}
            r={active === i ? 5 : 3.5}
            fill="var(--fit-accent)"
            stroke="#ffffff"
            strokeWidth={2}
          />
        ))}

        {/* Curseur */}
        {active !== null && (
          <line
            x1={xs[active]}
            x2={xs[active]}
            y1={PAD.top}
            y2={H - PAD.bottom}
            stroke="var(--fit-accent)"
            strokeOpacity={0.35}
            strokeWidth={1}
          />
        )}
      </svg>

      {a && active !== null && (
        <ChartTooltip x={xs[active]}>
          <span className="font-semibold">{fmtKg(a.weight)} kg</span> × {a.reps} rép. —{" "}
          {fmtDate(a.date)}
        </ChartTooltip>
      )}
    </div>
  );
}

// Courbe du poids corporel : moyenne mobile 7 jours (ligne principale) et
// pesées brutes en points atténués. Axe X proportionnel au temps.
export function BodyWeightChart({ entries }: { entries: BodyWeightPoint[] }) {
  const { xs, ysRaw, avg, ysAvg, yTicks, yFor } = useMemo(() => {
    const times = entries.map((e) => new Date(e.date).getTime());
    const avg = entries.map((e, i) => {
      const from = times[i] - 6 * DAY_MS;
      let sum = 0;
      let n = 0;
      for (let j = i; j >= 0 && times[j] >= from; j--) {
        sum += entries[j].weightKg;
        n++;
      }
      return sum / n;
    });

    const { yFor, yTicks } = buildYScale(
      [...entries.map((e) => e.weightKg), ...avg],
      0.2
    );
    const innerW = W - PAD.left - PAD.right;
    const t0 = times[0];
    const t1 = times[times.length - 1];
    const xs = times.map((t) =>
      t1 === t0 ? PAD.left + innerW / 2 : PAD.left + ((t - t0) / (t1 - t0)) * innerW
    );
    const ysRaw = entries.map((e) => yFor(e.weightKg));
    const ysAvg = avg.map((v) => yFor(v));
    return { xs, ysRaw, avg, ysAvg, yTicks, yFor };
  }, [entries]);

  const { active, containerRef, svgProps } = useChartInteraction(xs);

  const avgPath = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ysAvg[i]}`).join(" ");
  const a = active !== null ? entries[active] : null;

  return (
    <div className="relative" ref={containerRef}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Évolution du poids corporel (moyenne mobile 7 jours)"
        {...svgProps}
      >
        <GridAndTicks yTicks={yTicks} yFor={yFor} />

        {/* Dates première / dernière */}
        <text x={xs[0]} y={H - 8} textAnchor="start" fontSize={10} fill="var(--fit-ink-3)">
          {fmtDate(entries[0].date)}
        </text>
        {entries.length > 1 && (
          <text
            x={xs[xs.length - 1]}
            y={H - 8}
            textAnchor="end"
            fontSize={10}
            fill="var(--fit-ink-3)"
          >
            {fmtDate(entries[entries.length - 1].date)}
          </text>
        )}

        {/* Pesées brutes atténuées */}
        {xs.map((x, i) => (
          <circle
            key={i}
            cx={x}
            cy={ysRaw[i]}
            r={active === i ? 4.5 : 3}
            fill="var(--fit-ink-3)"
            opacity={active === i ? 0.9 : 0.5}
          />
        ))}

        {/* Moyenne mobile 7 jours */}
        {entries.length > 1 && (
          <path
            d={avgPath}
            fill="none"
            stroke="var(--fit-accent)"
            strokeWidth={2}
            strokeLinejoin="round"
          />
        )}

        {/* Curseur */}
        {active !== null && (
          <line
            x1={xs[active]}
            x2={xs[active]}
            y1={PAD.top}
            y2={H - PAD.bottom}
            stroke="var(--fit-accent)"
            strokeOpacity={0.35}
            strokeWidth={1}
          />
        )}
      </svg>

      {a && active !== null && (
        <ChartTooltip x={xs[active]}>
          <div>
            <span className="font-semibold">{fmtKg(a.weightKg)} kg</span> — {fmtDate(a.date)}
          </div>
          <div style={{ opacity: 0.75 }}>moy. 7 j : {fmtKg(avg[active])} kg</div>
        </ChartTooltip>
      )}
    </div>
  );
}
