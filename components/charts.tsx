"use client";

import { useEffect, useRef, useState } from "react";

export type Point = { label: string; value: number };

const COLOR = "var(--color-brand-600)";
const GRID = "var(--color-line)";
const H = 180;
const PAD = { top: 12, right: 12, bottom: 24, left: 44 };

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

/** Graduations « propres » (0, 5, 10… / 0, 1 000, 2 000…). */
function niceTicks(max: number) {
  if (max <= 0) return [0, 1];
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
  const ticks = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(Math.round(v));
  if (ticks[ticks.length - 1] < max) ticks.push(Math.round(ticks[ticks.length - 1] + step));
  return ticks;
}

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

function Axes({ width, ticks, yMax, points, x }: {
  width: number; ticks: number[]; yMax: number; points: Point[]; x: (i: number) => number;
}) {
  const y = (v: number) => PAD.top + (H - PAD.top - PAD.bottom) * (1 - v / yMax);
  // Étiquettes d'abscisse clairsemées (≈ 6 max)
  const every = Math.max(1, Math.ceil(points.length / 6));
  return (
    <g fontSize={11} fill="var(--color-muted)">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
          <text x={PAD.left - 6} y={y(t)} textAnchor="end" dominantBaseline="middle" style={{ fontVariantNumeric: "tabular-nums" }}>
            {fmt(t)}
          </text>
        </g>
      ))}
      {points.map((p, i) =>
        i % every === 0 || i === points.length - 1 ? (
          <text key={i} x={x(i)} y={H - 6} textAnchor="middle">{p.label}</text>
        ) : null,
      )}
    </g>
  );
}

function Tooltip({ left, top, label, value, unit }: { left: number; top: number; label: string; value: number; unit?: string }) {
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs shadow-md"
      style={{ left, top: top - 8 }}
    >
      <p className="font-semibold text-ink">{fmt(value)}{unit ? ` ${unit}` : ""}</p>
      <p className="text-muted">{label}</p>
    </div>
  );
}

export function LineChart({ points, unit, ariaLabel }: { points: Point[]; unit?: string; ariaLabel: string }) {
  const { ref, width } = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(0, ...points.map((p) => p.value));
  const ticks = niceTicks(max);
  const yMax = ticks[ticks.length - 1] || 1;
  const innerW = Math.max(1, width - PAD.left - PAD.right);
  const x = (i: number) => PAD.left + (points.length > 1 ? (innerW * i) / (points.length - 1) : innerW / 2);
  const y = (v: number) => PAD.top + (H - PAD.top - PAD.bottom) * (1 - v / yMax);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.value)}`).join(" ");
  const area = points.length ? `${path} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z` : "";
  const last = points.length - 1;

  return (
    <div ref={ref} className="relative">
      {width > 0 && (
        <svg
          width={width}
          height={H}
          role="img"
          aria-label={ariaLabel}
          onPointerMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const px = e.clientX - rect.left;
            const i = Math.round(((px - PAD.left) / innerW) * (points.length - 1));
            setHover(Math.max(0, Math.min(last, i)));
          }}
          onPointerLeave={() => setHover(null)}
        >
          <Axes width={width} ticks={ticks} yMax={yMax} points={points} x={x} />
          <path d={area} fill={COLOR} opacity={0.1} />
          <path d={path} fill="none" stroke={COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--color-ink)" strokeOpacity={0.35} strokeWidth={1} />
          )}
          {last >= 0 && (
            <>
              <circle cx={x(hover ?? last)} cy={y(points[hover ?? last].value)} r={5} fill={COLOR} stroke="white" strokeWidth={2} />
              {hover === null && (
                <text x={x(last) - 8} y={y(points[last].value) - 10} textAnchor="end" fontSize={12} fontWeight={600} fill="var(--color-ink)">
                  {fmt(points[last].value)}
                </text>
              )}
            </>
          )}
        </svg>
      )}
      {hover !== null && points[hover] && (
        <Tooltip left={x(hover)} top={y(points[hover].value)} label={points[hover].label} value={points[hover].value} unit={unit} />
      )}
    </div>
  );
}

export function ColumnChart({ points, unit, ariaLabel }: { points: Point[]; unit?: string; ariaLabel: string }) {
  const { ref, width } = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(0, ...points.map((p) => p.value));
  const ticks = niceTicks(max);
  const yMax = ticks[ticks.length - 1] || 1;
  const innerW = Math.max(1, width - PAD.left - PAD.right);
  const band = innerW / Math.max(1, points.length);
  const barW = Math.max(2, Math.min(24, band - 2)); // ≤ 24px, 2px d'air entre colonnes
  const x = (i: number) => PAD.left + band * i + band / 2;
  const y = (v: number) => PAD.top + (H - PAD.top - PAD.bottom) * (1 - v / yMax);
  const base = y(0);
  const maxIdx = points.reduce((m, p, i) => (p.value > points[m].value ? i : m), 0);

  // Colonne avec extrémité arrondie (4px) et base carrée
  const bar = (i: number, v: number) => {
    const top = y(v);
    const h = base - top;
    if (h <= 0) return "";
    const r = Math.min(4, h, barW / 2);
    const l = x(i) - barW / 2;
    return `M${l},${base} V${top + r} Q${l},${top} ${l + r},${top} H${l + barW - r} Q${l + barW},${top} ${l + barW},${top + r} V${base} Z`;
  };

  return (
    <div ref={ref} className="relative">
      {width > 0 && (
        <svg width={width} height={H} role="img" aria-label={ariaLabel}>
          <Axes width={width} ticks={ticks} yMax={yMax} points={points} x={x} />
          {points.map((p, i) => (
            <g key={i}>
              <path d={bar(i, p.value)} fill={COLOR} opacity={hover === null || hover === i ? 1 : 0.55} />
              {/* Zone de survol/focus plus large que la colonne */}
              <rect
                x={x(i) - band / 2}
                y={PAD.top}
                width={band}
                height={H - PAD.top - PAD.bottom}
                fill="transparent"
                tabIndex={0}
                aria-label={`${p.label} : ${fmt(p.value)}${unit ? ` ${unit}` : ""}`}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                className="outline-none"
              />
            </g>
          ))}
          {hover === null && max > 0 && (
            <text x={x(maxIdx)} y={y(points[maxIdx].value) - 6} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--color-ink)">
              {fmt(points[maxIdx].value)}
            </text>
          )}
        </svg>
      )}
      {hover !== null && points[hover] && (
        <Tooltip left={x(hover)} top={y(points[hover].value)} label={points[hover].label} value={points[hover].value} unit={unit} />
      )}
    </div>
  );
}

/** Vue tableau (accessibilité : les valeurs restent lisibles sans survol). */
export function DataTable({ points, unit }: { points: Point[]; unit?: string }) {
  return (
    <details className="mt-2 text-xs">
      <summary className="cursor-pointer text-muted hover:text-ink">Voir les données</summary>
      <div className="mt-2 max-h-48 overflow-y-auto">
        <table className="w-full">
          <tbody>
            {points.map((p) => (
              <tr key={p.label} className="border-b border-line last:border-0">
                <td className="py-1 text-muted">{p.label}</td>
                <td className="py-1 text-right" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {fmt(p.value)}{unit ? ` ${unit}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
