"use client";

import { useEffect, useState } from "react";
import { li } from "../../lib/theme";

function band(percent: number) { return percent >= 70 ? { color: li.green, label: "Strong match" } : percent >= 40 ? { color: li.blue, label: "On your way" } : { color: li.amber, label: "Just getting started" }; }

export default function FitRing({ percent, size = 160 }: { percent: number; size?: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => { setShown(0); const id = requestAnimationFrame(() => setShown(percent)); return () => cancelAnimationFrame(id); }, [percent]);
  const stroke = 12; const radius = (size - stroke) / 2; const circumference = 2 * Math.PI * radius; const { color, label } = band(percent);
  return <div style={{ width: size, textAlign: "center", fontFamily: li.font }}><svg width={size} height={size} aria-label={`${percent}% readiness`}><circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e7e4df" strokeWidth={stroke} /><circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - shown / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dashoffset 1s ease-out" }} /><text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: size * .26, fontWeight: 700, fill: li.textPrimary }}>{percent}%</text><text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: size * .08, fill: li.textSecondary, letterSpacing: .5 }}>READINESS</text></svg><div style={{ marginTop: 6, fontWeight: 600, color, fontSize: 14 }}>{label}</div></div>;
}
