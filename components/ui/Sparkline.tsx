"use client";

interface Props {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}

export default function Sparkline({ data, color = "#c4410c", height = 32, width = 72 }: Props) {
  if (!data || data.length < 2 || data.every((v) => v === 0)) {
    return (
      <svg width={width} height={height}>
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="rgba(24,22,15,0.08)" strokeWidth={1} />
      </svg>
    );
  }

  const max = Math.max(...data);
  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const step = w / (data.length - 1);
  const scaleY = (v: number) => pad + h - (v / max) * h;

  const pts = data.map((v, i) => `${pad + i * step},${scaleY(v)}`);
  const polyPts = pts.join(" ");
  const areaPts = [`${pad},${pad + h}`, ...pts, `${pad + (data.length - 1) * step},${pad + h}`].join(" ");
  const gradId = `sp-${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={areaPts} fill={`url(#${gradId})`} />
      <polyline points={polyPts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pad + (data.length - 1) * step} cy={scaleY(data[data.length - 1])} r={2.5} fill={color} />
    </svg>
  );
}
