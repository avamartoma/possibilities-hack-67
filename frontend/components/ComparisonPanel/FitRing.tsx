"use client";

// Animated circular % indicator — the visual centerpiece of the Comparison Page.
// The ring fills from 0 -> percent on mount/change, and is color-banded by fit.

import { useEffect, useState } from "react";

interface FitRingProps {
  percent: number;
  size?: number;
}

function band(percent: number): { color: string; label: string } {
  if (percent >= 70) return { color: "#16a34a", label: "Ready to go" };
  if (percent >= 40) return { color: "#2563eb", label: "On your way" };
  return { color: "#d97706", label: "Just getting started" };
}

export default function FitRing({ percent, size = 180 }: FitRingProps) {
  const [shown, setShown] = useState(0);

  // Animate the fill whenever the target percent changes.
  useEffect(() => {
    setShown(0);
    const id = requestAnimationFrame(() => setShown(percent));
    return () => cancelAnimationFrame(id);
  }, [percent]);

  const stroke = 14;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - shown / 100);
  const { color, label } = band(percent);

  return (
    <div style={{ width: size, textAlign: "center" }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
        <text
          x="50%"
          y="47%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: size * 0.26, fontWeight: 700, fill: color }}
        >
          {percent}%
        </text>
        <text
          x="50%"
          y="63%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: size * 0.075, fill: "#6b7280", letterSpacing: 0.5 }}
        >
          JOB FIT
        </text>
      </svg>
      <div style={{ marginTop: 8, fontWeight: 600, color }}>{label}</div>
    </div>
  );
}
