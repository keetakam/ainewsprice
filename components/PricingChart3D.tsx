"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import type { ModelPrice } from "@/lib/prices";

// ─── Config ───────────────────────────────────────────────────────────────────

const PROVIDER_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#14b8a6",
  "#a855f7", "#0ea5e9", "#22c55e", "#fb923c", "#e879f9",
];

type MetricKey = "promptPrice" | "completionPrice" | "contextLength";

const METRICS: Record<MetricKey, { label: string; fmt: (v: number) => string }> = {
  promptPrice:     { label: "Input Price ($/1M tok)",  fmt: (v) => v < 0.01 ? `$${v.toFixed(5)}` : `$${v.toFixed(3)}` },
  completionPrice: { label: "Output Price ($/1M tok)", fmt: (v) => v < 0.01 ? `$${v.toFixed(5)}` : `$${v.toFixed(3)}` },
  contextLength:   { label: "Context Window",          fmt: (v) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}` },
};

const METRIC_KEYS = Object.keys(METRICS) as MetricKey[];
const PAD = { top: 24, right: 24, bottom: 56, left: 72 };

// ─── Math ─────────────────────────────────────────────────────────────────────

function logNorm(val: number, min: number, max: number): number {
  if (val <= 0 || min <= 0 || max <= min) return 0;
  const lv = Math.log10(val), lMin = Math.log10(min), lMax = Math.log10(max);
  return Math.max(0, Math.min(1, (lv - lMin) / (lMax - lMin)));
}

function normToData(norm: number, min: number, max: number): number {
  return min * Math.pow(max / min, norm);
}

function logTicks(min: number, max: number, count = 5): number[] {
  if (min <= 0 || max <= min) return [];
  const ticks: number[] = [];
  for (let i = 0; i <= count; i++) ticks.push(normToData(i / count, min, max));
  return ticks;
}

// free (=0) → plot at -0.08 so it shows just outside the axis origin
function normVal(val: number, min: number, max: number): number {
  if (val <= 0) return -0.08;
  return logNorm(val, min, max);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface View { x0: number; x1: number; y0: number; y1: number }
const DEFAULT_VIEW: View = { x0: 0, x1: 1, y0: 0, y1: 1 };

// ─── Component ────────────────────────────────────────────────────────────────

export default function PricingChart({ models }: { models: ModelPrice[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [axisX, setAxisX] = useState<MetricKey>("promptPrice");
  const [axisY, setAxisY] = useState<MetricKey>("completionPrice");
  const [view, setView] = useState<View>(DEFAULT_VIEW);
  const [tooltip, setTooltip] = useState<{ cx: number; cy: number; model: ModelPrice } | null>(null);
  const dragRef = useRef<{ sx: number; sy: number; vx0: number; vx1: number; vy0: number; vy1: number } | null>(null);
  const viewRef = useRef(view);
  viewRef.current = view;

  // Reset view when axes change
  useEffect(() => { setView(DEFAULT_VIEW); }, [axisX, axisY]);

  const visible = useMemo(() => models.filter(m => m.contextLength > 0), [models]);

  const colorMap = useMemo(() => {
    const providers = Array.from(new Set(visible.map(m => m.provider))).sort();
    return new Map(providers.map((p, i) => [p, PROVIDER_COLORS[i % PROVIDER_COLORS.length]]));
  }, [visible]);

  // range based on non-zero values only (log scale)
  const rangeX = useMemo(() => {
    const vals = visible.map(m => m[axisX] as number).filter(v => v > 0);
    if (vals.length === 0) return { min: 1, max: 10 };
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [visible, axisX]);

  const rangeY = useMemo(() => {
    const vals = visible.map(m => m[axisY] as number).filter(v => v > 0);
    if (vals.length === 0) return { min: 1, max: 10 };
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [visible, axisY]);

  const points = useMemo(() => visible.map(m => ({
    nx: normVal(m[axisX] as number, rangeX.min, rangeX.max),
    ny: normVal(m[axisY] as number, rangeY.min, rangeY.max),
    model: m,
    color: colorMap.get(m.provider) ?? "#6366f1",
  })), [visible, axisX, axisY, rangeX, rangeY, colorMap]);

  // Convert normalized data coord → canvas pixel
  const toCanvas = useCallback((nx: number, ny: number, W: number, H: number, v: View): [number, number] => {
    const cw = W - PAD.left - PAD.right;
    const ch = H - PAD.top - PAD.bottom;
    return [
      PAD.left + (nx - v.x0) / (v.x1 - v.x0) * cw,
      PAD.top + (1 - (ny - v.y0) / (v.y1 - v.y0)) * ch,
    ];
  }, []);

  // Convert canvas pixel → normalized data coord
  const fromCanvas = useCallback((mx: number, my: number, W: number, H: number, v: View): [number, number] => {
    const cw = W - PAD.left - PAD.right;
    const ch = H - PAD.top - PAD.bottom;
    return [
      v.x0 + (mx - PAD.left) / cw * (v.x1 - v.x0),
      v.y0 + (1 - (my - PAD.top) / ch) * (v.y1 - v.y0),
    ];
  }, []);

  const draw = useCallback((v: View) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const cw = W - PAD.left - PAD.right;
    const ch = H - PAD.top - PAD.bottom;

    ctx.fillStyle = "#0d0d18";
    ctx.fillRect(0, 0, W, H);

    // Clip to chart area
    ctx.save();
    ctx.beginPath();
    ctx.rect(PAD.left, PAD.top, cw, ch);
    ctx.clip();

    // Grid + X ticks
    if (rangeX.min > 0 && rangeX.max > rangeX.min) {
      const vMinX = Math.max(1e-12, normToData(v.x0, rangeX.min, rangeX.max));
      const vMaxX = normToData(v.x1, rangeX.min, rangeX.max);
      logTicks(vMinX, vMaxX, 5).forEach(val => {
        const nx = logNorm(val, rangeX.min, rangeX.max);
        const [cx] = toCanvas(nx, 0, W, H, v);
        ctx.strokeStyle = "rgba(255,255,255,0.07)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx, PAD.top); ctx.lineTo(cx, PAD.top + ch); ctx.stroke();
      });
    }

    // Grid + Y ticks
    if (rangeY.min > 0 && rangeY.max > rangeY.min) {
      const vMinY = Math.max(1e-12, normToData(v.y0, rangeY.min, rangeY.max));
      const vMaxY = normToData(v.y1, rangeY.min, rangeY.max);
      logTicks(vMinY, vMaxY, 5).forEach(val => {
        const ny = logNorm(val, rangeY.min, rangeY.max);
        const [, cy] = toCanvas(0, ny, W, H, v);
        ctx.strokeStyle = "rgba(255,255,255,0.07)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(PAD.left, cy); ctx.lineTo(PAD.left + cw, cy); ctx.stroke();
      });
    }

    // Points
    if (points.length > 0) {
      for (const p of points) {
        const [px, py] = toCanvas(p.nx, p.ny, W, H, v);
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fillStyle = p.color + "cc";
        ctx.fill();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const label = p.model.name.length > 22 ? p.model.name.slice(0, 20) + "…" : p.model.name;
        ctx.font = "10px system-ui,sans-serif";
        ctx.textAlign = "left";
        const lw = ctx.measureText(label).width;
        ctx.fillStyle = "rgba(13,13,24,0.8)";
        ctx.fillRect(px + 10, py - 10, lw + 6, 14);
        ctx.fillStyle = p.color;
        ctx.fillText(label, px + 13, py + 1);
      }
    }

    ctx.restore(); // end clip

    // Axes border
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(PAD.left, PAD.top);
    ctx.lineTo(PAD.left, PAD.top + ch);
    ctx.lineTo(PAD.left + cw, PAD.top + ch);
    ctx.stroke();

    // Tick labels X (outside clip)
    if (rangeX.min > 0 && rangeX.max > rangeX.min) {
      const vMinX = Math.max(1e-12, normToData(v.x0, rangeX.min, rangeX.max));
      const vMaxX = normToData(v.x1, rangeX.min, rangeX.max);
      logTicks(vMinX, vMaxX, 5).forEach(val => {
        const nx = logNorm(val, rangeX.min, rangeX.max);
        const [cx] = toCanvas(nx, 0, W, H, v);
        if (cx < PAD.left || cx > PAD.left + cw) return;
        ctx.font = "10px system-ui,sans-serif";
        ctx.fillStyle = "#ffffff55";
        ctx.textAlign = "center";
        ctx.fillText(METRICS[axisX].fmt(val), cx, PAD.top + ch + 16);
      });
    }

    // Tick labels Y (outside clip)
    if (rangeY.min > 0 && rangeY.max > rangeY.min) {
      const vMinY = Math.max(1e-12, normToData(v.y0, rangeY.min, rangeY.max));
      const vMaxY = normToData(v.y1, rangeY.min, rangeY.max);
      logTicks(vMinY, vMaxY, 5).forEach(val => {
        const ny = logNorm(val, rangeY.min, rangeY.max);
        const [, cy] = toCanvas(0, ny, W, H, v);
        if (cy < PAD.top || cy > PAD.top + ch) return;
        ctx.font = "10px system-ui,sans-serif";
        ctx.fillStyle = "#ffffff55";
        ctx.textAlign = "right";
        ctx.fillText(METRICS[axisY].fmt(val), PAD.left - 6, cy + 4);
      });
    }

    // Axis labels
    ctx.font = "bold 11px system-ui,sans-serif";
    ctx.fillStyle = "#ffffff88";
    ctx.textAlign = "center";
    ctx.fillText(METRICS[axisX].label, PAD.left + cw / 2, H - 8);
    ctx.save();
    ctx.translate(14, PAD.top + ch / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(METRICS[axisY].label, 0, 0);
    ctx.restore();

    // Empty state
    if (points.length === 0) {
      ctx.font = "bold 14px system-ui,sans-serif";
      ctx.fillStyle = "#ffffff33";
      ctx.textAlign = "center";
      ctx.fillText("กด  + Add to Compare  เพื่อเพิ่ม model ในกราฟ", W / 2, H / 2);
    }
  }, [points, axisX, axisY, rangeX, rangeY, toCanvas]);

  useEffect(() => { draw(view); }, [view, draw]);

  // Non-passive wheel handler (must be attached via useEffect)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const rect = canvas!.getBoundingClientRect();
      const scaleX = canvas!.width / rect.width;
      const scaleY = canvas!.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      const v = viewRef.current;
      const [nx, ny] = [
        v.x0 + (mx - PAD.left) / (canvas!.width - PAD.left - PAD.right) * (v.x1 - v.x0),
        v.y0 + (1 - (my - PAD.top) / (canvas!.height - PAD.top - PAD.bottom)) * (v.y1 - v.y0),
      ];
      const factor = e.deltaY > 0 ? 1.25 : 1 / 1.25;
      setView({
        x0: nx - (nx - v.x0) * factor,
        x1: nx + (v.x1 - nx) * factor,
        y0: ny - (ny - v.y0) * factor,
        y1: ny + (v.y1 - ny) * factor,
      });
    }

    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    dragRef.current = {
      sx: e.clientX, sy: e.clientY,
      vx0: view.x0, vx1: view.x1, vy0: view.y0, vy1: view.y1,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (dragRef.current) {
      const d = dragRef.current;
      const W = canvas.width, H = canvas.height;
      const cw = W - PAD.left - PAD.right;
      const ch = H - PAD.top - PAD.bottom;
      const dx = (e.clientX - d.sx) * scaleX / cw * (d.vx1 - d.vx0);
      const dy = (e.clientY - d.sy) * scaleY / ch * (d.vy1 - d.vy0);
      setView({ x0: d.vx0 - dx, x1: d.vx1 - dx, y0: d.vy0 + dy, y1: d.vy1 + dy });
      setTooltip(null);
      return;
    }

    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const W = canvas.width, H = canvas.height;
    const hit = points.find(p => {
      const [px, py] = toCanvas(p.nx, p.ny, W, H, viewRef.current);
      return Math.hypot(px - mx, py - my) < 10;
    });
    setTooltip(hit ? { cx: e.clientX - rect.left, cy: e.clientY - rect.top, model: hit.model } : null);
  };

  const handleMouseUp = () => { dragRef.current = null; };

  const selStyle: React.CSSProperties = {
    padding: "5px 10px", borderRadius: 7,
    border: "1px solid var(--border)",
    background: "var(--surface)", color: "var(--text)",
    fontSize: 12, cursor: "pointer",
  };
  const btnStyle: React.CSSProperties = {
    padding: "5px 10px", borderRadius: 7,
    border: "1px solid var(--border)",
    background: "transparent", color: "var(--muted)",
    fontSize: 11, cursor: "pointer",
  };

  return (
    <div style={{ marginBottom: 32 }}>
      {/* Controls */}
      <div style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          {visible.length} models · scroll to zoom · drag to pan
        </span>
        <label style={{ fontSize: 12, color: "var(--muted)", display: "flex", gap: 6, alignItems: "center" }}>
          X:
          <select value={axisX} onChange={e => setAxisX(e.target.value as MetricKey)} style={selStyle}>
            {METRIC_KEYS.map(k => <option key={k} value={k}>{METRICS[k].label}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 12, color: "var(--muted)", display: "flex", gap: 6, alignItems: "center" }}>
          Y:
          <select value={axisY} onChange={e => setAxisY(e.target.value as MetricKey)} style={selStyle}>
            {METRIC_KEYS.map(k => <option key={k} value={k}>{METRICS[k].label}</option>)}
          </select>
        </label>
        <button onClick={() => setView(DEFAULT_VIEW)} style={btnStyle}>
          Reset zoom
        </button>
      </div>

      {/* Canvas */}
      <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
        <canvas
          ref={canvasRef}
          width={800} height={480}
          style={{ width: "100%", display: "block", cursor: dragRef.current ? "grabbing" : "crosshair" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { handleMouseUp(); setTooltip(null); }}
        />

        {tooltip && (
          <div style={{
            position: "absolute",
            left: Math.min(tooltip.cx + 14, 420), top: Math.max(tooltip.cy - 80, 8),
            background: "var(--surface2,#1e1e2e)", border: "1px solid var(--border)",
            borderRadius: 8, padding: "10px 14px", fontSize: 12,
            pointerEvents: "none", zIndex: 10, minWidth: 190,
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          }}>
            <p style={{ fontWeight: 700, marginBottom: 6, fontSize: 13, color: "var(--text)" }}>
              {tooltip.model.name}
            </p>
            <p style={{ color: "#ffffff99", marginBottom: 2 }}>
              {METRICS[axisX].label}: {METRICS[axisX].fmt(tooltip.model[axisX] as number)}
            </p>
            <p style={{ color: "#ffffff99" }}>
              {METRICS[axisY].label}: {METRICS[axisY].fmt(tooltip.model[axisY] as number)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
