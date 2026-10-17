"use client";

interface Props {
  points: number[];
  width?: number;
  height?: number;
}

/** Minimal inline SVG sparkline — no chart library needed. */
export default function Sparkline({ points, width = 120, height = 32 }: Props) {
  if (points.length < 2) {
    return <span className="text-[11px] text-slate-400">not enough data</span>;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = width / (points.length - 1);

  const coords = points.map((p, i) => {
    const x = i * stepX;
    // invert y: higher price = higher on screen
    const y = height - ((p - min) / range) * height;
    return [x, y] as const;
  });

  const path = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  const [lastX, lastY] = coords[coords.length - 1];
  const rising = points[points.length - 1] > points[points.length - 2];

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path
        d={path}
        fill="none"
        stroke={rising ? "#e11d48" : "#059669"}
        strokeWidth={1.5}
      />
      <circle cx={lastX} cy={lastY} r={2.5} fill={rising ? "#e11d48" : "#059669"} />
    </svg>
  );
}
