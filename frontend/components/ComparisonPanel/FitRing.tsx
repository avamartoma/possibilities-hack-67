"use client";

// Animated circular % indicator — the visual centerpiece of the Comparison Page.
// The ring fills from 0 -> percent on mount/change, color-banded LinkedIn-style.

import { useEffect, useState } from "react";
import { li } from "../../lib/theme";

interface FitRingProps {
  percent: number;
  size?: number;
}

function band(percent: number): { color: string; label: string } {
  if (percent >= 70) return { color: li.green, label: "Strong match" };
  if (percent >= 40) return { color: li.blue, label: "On your way" };
  return { color: li.amber, label: "Just getting started" };
}

export default function FitRing({ percent, size = 160 }: FitRingProps) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    setShown(0);
    const id = requestAnimationFrame(() => setShown(percent));
    return () => cancelAnimationFrame(id);
  }, [percent]);

  const stroke = 12;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - shown / 100);
  const { color, label } = band(percent);

  return (
    <div style={{ width: size, textAlign: "center", fontFamily: li.font }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e7e4df"
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
          y="46%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: size * 0.26, fontWeight: 700, fill: li.textPrimary }}
        >
          {percent}%
        </text>
        <text
          x="50%"
          y="62%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: size * 0.08, fill: li.textSecondary, letterSpacing: 0.5 }}
        >
          JOB FIT
        </text>
      </svg>
      <div style={{ marginTop: 6, fontWeight: 600, color, fontSize: 14 }}>
        {label}
      </div>
    </div>
  );
}
