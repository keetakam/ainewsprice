"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import type { ModelPrice } from "@/lib/prices";

// ─── Config ──────────────────────────────────────────────────────────────────

const PROVIDER_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#14b8a6",
  "#a855f7", "#0ea5e9", "#22c55e", "#fb923c", "#e879f9",
];

type MetricKey = "promptPrice" | "completionPrice" | "contextLength";

const METRICS: Record<MetricKey, { label: string; color: string; fmt: (v: number) => string }> = {
  promptPrice:     { label: "Input Price",     color: "#ef4444", fmt: (v) => v < 0.01 ? `$${v.toFixed(5)}` : `$${v.toFixed(3)}` },
  completionPrice: { label: "Output Price",    color: "#10b981", fmt: (v) => v < 0.01 ? `$${v.toFixed(5)}` : `$${v.toFixed(3)}` },
  contextLength:   { label: "Context Window",  color: "#6366f1", fmt: (v) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : `${v}` },
};

const AXIS_COLORS = { x: "#ef4444", y: "#10b981", z: "#6366f1" };

// ─── Math ─────────────────────────────────────────────────────────────────────

function logNorm(val: number, min: number, max: number): number {
  if (val <= 0 || min <= 0 || max <= min) return 0;
  const lv = Math.log10(val), lMin = Math.log10(min), lMax = Math.log10(max);
  return Math.max(0, Math.min(1, (lv - lMin) / (lMax - lMin)));
}

function project(x: number, y: number, z: number, rotX: number, rotY: number, W: number, H: number): [number, number, number] {
  const cx = x - 0.5, cy = y - 0.5, cz = z - 0.5;
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
  const rx = cx * cosY - cz * sinY;
  const rz1 = cx * sinY + cz * cosY;
  const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
  const ry = cy * cosX - rz1 * sinX;
  const rz2 = cy * sinX + rz1 * cosX;
  const fov = 2.8, d = rz2 + fov, s = fov / d;
  const pad = 0.18, pw = W * (1 - pad * 2), ph = H * (1 - pad * 2);
  return [(rx * s + 0.5) * pw + W * pad, (-ry * s + 0.5) * ph + H * pad, rz2];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PricingChart3D({ models }: { models: ModelPrice[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotX, setRotX] = useState(0.5);
  const [rotY, setRotY] = useState(0.7);
  const [tooltip, setTooltip] = useState<{ cx: number; cy: number; model: ModelPrice } | null>(null);
  const dragRef = useRef<{ sx: number; sy: number; rx: number; ry: number } | null>(null);

  const axisX: MetricKey = "promptPrice";
  const axisY: MetricKey = "completionPrice";
  const axisZ: MetricKey = "contextLength";

  const visible = useMemo(() =>
    models.filter(m => m.promptPrice > 0 && m.completionPrice > 0 && m.contextLength > 0),
    [models]
  );

  const providers = useMemo(() => Array.from(new Set(visible.map(m => m.provider))).sort(), [visible]);
  const colorMap = useMemo(() =>
    new Map(providers.map((p, i) => [p, PROVIDER_COLORS[i % PROVIDER_COLORS.length]])),
    [providers]
  );

  // Compute ranges per metric
  const metricRange = useMemo(() => {
    const get = (key: MetricKey) => {
      const vals = visible.map(m => m[key] as number).filter(v => v > 0);
      return { min: Math.min(...vals), max: Math.max(...vals) };
    };
    return { promptPrice: get("promptPrice"), completionPrice: get("completionPrice"), contextLength: get("contextLength") };
  }, [visible]);

  const points = useMemo(() => visible.map(m => ({
    nx: logNorm(m[axisX] as number, metricRange[axisX].min, metricRange[axisX].max),
    ny: logNorm(m[axisY] as number, metricRange[axisY].min, metricRange[axisY].max),
    nz: logNorm(m[axisZ] as number, metricRange[axisZ].min, metricRange[axisZ].max),
    model: m,
    color: colorMap.get(m.provider) ?? "#6366f1",
  })), [visible, axisX, axisY, axisZ, metricRange, colorMap]);

  const draw = useCallback((rx: number, ry: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;

    // Solid background
    ctx.fillStyle = "#0d0d18";
    ctx.fillRect(0, 0, W, H);

    // Floor grid
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const t = i / 5;
      const [x1,y1] = project(0,0,t, rx,ry,W,H); const [x2,y2] = project(1,0,t, rx,ry,W,H);
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      const [x3,y3] = project(t,0,0, rx,ry,W,H); const [x4,y4] = project(t,0,1, rx,ry,W,H);
      ctx.beginPath(); ctx.moveTo(x3,y3); ctx.lineTo(x4,y4); ctx.stroke();
    }

    // Origin marker
    const [ox,oy] = project(0,0,0, rx,ry,W,H);
    ctx.beginPath(); ctx.arc(ox,oy,5,0,Math.PI*2);
    ctx.fillStyle = "#ffffff88"; ctx.fill();

    // Axes
    const axisList = [
      { color: AXIS_COLORS.x, label: `X: ${METRICS[axisX].label}`, ex:1, ey:0, ez:0 },
      { color: AXIS_COLORS.y, label: `Y: ${METRICS[axisY].label}`, ex:0, ey:1, ez:0 },
      { color: AXIS_COLORS.z, label: `Z: ${METRICS[axisZ].label}`, ex:0, ey:0, ez:1 },
    ];
    for (const ax of axisList) {
      const [px1,py1] = project(0,0,0, rx,ry,W,H);
      const [px2,py2] = project(ax.ex,ax.ey,ax.ez, rx,ry,W,H);

      // Glow pass
      ctx.save();
      ctx.shadowColor = ax.color;
      ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.moveTo(px1,py1); ctx.lineTo(px2,py2);
      ctx.strokeStyle = ax.color; ctx.lineWidth = 4; ctx.stroke();
      ctx.restore();

      // Arrowhead
      const angle = Math.atan2(py2-py1, px2-px1);
      ctx.beginPath();
      ctx.moveTo(px2,py2);
      ctx.lineTo(px2-14*Math.cos(angle-0.35), py2-14*Math.sin(angle-0.35));
      ctx.lineTo(px2-14*Math.cos(angle+0.35), py2-14*Math.sin(angle+0.35));
      ctx.closePath(); ctx.fillStyle = ax.color; ctx.fill();

      // Label with opaque background
      ctx.font = "bold 13px system-ui,sans-serif";
      const tw = ctx.measureText(ax.label).width;
      const lx = px2 + 10, ly = py2 + 5;
      ctx.fillStyle = "rgba(13,13,24,0.85)";
      ctx.fillRect(lx - 3, ly - 14, tw + 8, 18);
      ctx.fillStyle = ax.color;
      ctx.fillText(ax.label, lx + 1, ly);
    }

    // Tick labels
    const drawTicks = (axis: "x"|"y"|"z", metricKey: MetricKey) => {
      const r = metricRange[metricKey];
      if (!r || r.min <= 0 || r.max <= 0 || r.min >= r.max) return;
      for (let i = 1; i <= 4; i++) {
        const t = i / 4;
        const [px,py] = axis === "x" ? project(t,0,0, rx,ry,W,H)
                       : axis === "y" ? project(0,t,0, rx,ry,W,H)
                       : project(0,0,t, rx,ry,W,H);
        const val = r.min * Math.pow(r.max / r.min, t);
        const txt = METRICS[metricKey].fmt(val);
        ctx.font = "10px system-ui,sans-serif";
        const tw = ctx.measureText(txt).width;
        ctx.fillStyle = "rgba(13,13,24,0.7)";
        ctx.fillRect(px+2, py-11, tw+4, 13);
        ctx.fillStyle = AXIS_COLORS[axis] + "cc";
        ctx.fillText(txt, px+4, py);
      }
    };
    drawTicks("x", axisX);
    drawTicks("y", axisY);
    drawTicks("z", axisZ);

    // Empty state
    if (points.length === 0) {
      ctx.font = "bold 15px system-ui,sans-serif";
      ctx.fillStyle = "#ffffff33";
      const msg = "กด  + Add to Compare  เพื่อเพิ่ม model ในกราฟ";
      const tw = ctx.measureText(msg).width;
      ctx.fillText(msg, (W - tw) / 2, H / 2);
      ctx.font = "12px system-ui,sans-serif";
      ctx.fillStyle = "#ffffff1a";
      const sub = "เลือก model แล้วกด Add ด้านบน";
      const sw = ctx.measureText(sub).width;
      ctx.fillText(sub, (W - sw) / 2, H / 2 + 26);
      return;
    }

    // Points (painter's algorithm)
    const projected = points.map(p => {
      const [px,py,pz] = project(p.nx,p.ny,p.nz, rx,ry,W,H);
      return { ...p, px, py, pz };
    }).sort((a,b) => b.pz - a.pz);

    for (const p of projected) {
      // Dot (larger since few points)
      ctx.beginPath(); ctx.arc(p.px, p.py, 8, 0, Math.PI*2);
      ctx.fillStyle = p.color+"dd"; ctx.fill();
      ctx.strokeStyle = p.color; ctx.lineWidth = 2; ctx.stroke();

      // Model name label
      const label = p.model.name.length > 24 ? p.model.name.slice(0, 22) + "…" : p.model.name;
      ctx.font = "bold 11px system-ui,sans-serif";
      const lw = ctx.measureText(label).width;
      ctx.fillStyle = "rgba(13,13,24,0.82)";
      ctx.fillRect(p.px + 11, p.py - 10, lw + 8, 16);
      ctx.fillStyle = p.color;
      ctx.fillText(label, p.px + 15, p.py + 2);
    }
  }, [points, axisX, axisY, axisZ, metricRange]);

  useEffect(() => { draw(rotX, rotY); }, [rotX, rotY, draw]);

  const getProjected = useCallback((rx: number, ry: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return [];
    const W = canvas.width, H = canvas.height;
    return points.map(p => {
      const [px,py,pz] = project(p.nx,p.ny,p.nz, rx,ry,W,H);
      return { ...p, px, py, pz };
    });
  }, [points]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    dragRef.current = { sx: e.clientX, sy: e.clientY, rx: rotX, ry: rotY };
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (dragRef.current) {
      setRotY(dragRef.current.ry + (e.clientX - dragRef.current.sx) * 0.008);
      setRotX(dragRef.current.rx + (e.clientY - dragRef.current.sy) * 0.008);
      setTooltip(null);
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    const hit = getProjected(rotX, rotY).find(p => Math.hypot(p.px - mx, p.py - my) < 9);
    setTooltip(hit ? { cx: e.clientX - rect.left, cy: e.clientY - rect.top, model: hit.model } : null);
  };
  const handleMouseUp = () => { dragRef.current = null; };

  const btnStyle: React.CSSProperties = {
    padding: "5px 10px", borderRadius: 7,
    border: "1px solid var(--border)",
    background: "transparent", color: "var(--muted)",
    fontSize: 11, cursor: "pointer",
  };

  return (
    <div style={{ marginBottom: 32 }}>

      <div style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>
          Drag to rotate · {visible.length} models
        </span>
        <button onClick={() => { setRotX(0.5); setRotY(0.7); }} style={btnStyle}>
          Reset view
        </button>
      </div>

      {/* Canvas */}
      <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
        <canvas
          ref={canvasRef}
          width={800} height={520}
          style={{ width: "100%", display: "block", cursor: "grab" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {tooltip && (
          <div style={{
            position: "absolute",
            left: Math.min(tooltip.cx + 14, 420), top: Math.max(tooltip.cy - 90, 8),
            background: "var(--surface2,#1e1e2e)", border: "1px solid var(--border)",
            borderRadius: 8, padding: "10px 14px", fontSize: 12,
            pointerEvents: "none", zIndex: 10, minWidth: 190,
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          }}>
            <p style={{ fontWeight: 700, marginBottom: 6, fontSize: 13, color: "var(--text)" }}>{tooltip.model.name}</p>
            <p style={{ color: AXIS_COLORS.x, marginBottom: 2 }}>
              {METRICS[axisX].label}: {METRICS[axisX].fmt(tooltip.model[axisX] as number)}
            </p>
            <p style={{ color: AXIS_COLORS.y, marginBottom: 2 }}>
              {METRICS[axisY].label}: {METRICS[axisY].fmt(tooltip.model[axisY] as number)}
            </p>
            <p style={{ color: AXIS_COLORS.z }}>
              {METRICS[axisZ].label}: {METRICS[axisZ].fmt(tooltip.model[axisZ] as number)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
