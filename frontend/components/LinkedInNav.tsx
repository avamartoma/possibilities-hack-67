"use client";

import { FormEvent, useState } from "react";
import { li } from "../lib/theme";

type Props = { userName?: string; onHome?: () => void; onJobs?: (query?: string) => void; onProfile?: () => void; onRestart?: () => void };
export default function LinkedInNav({ userName, onHome, onJobs, onProfile, onRestart }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const initial = (userName || "Y").trim().charAt(0).toUpperCase();
  function submit(event: FormEvent) { event.preventDefault(); onJobs?.(query.trim()); }
  const navButton: React.CSSProperties = { background: "none", border: "none", color: li.textSecondary, fontFamily: li.font, cursor: "pointer", fontSize: 13, fontWeight: 600, padding: "8px 10px" };
  return <header style={{ position: "sticky", top: 0, zIndex: 20, background: li.cardBg, borderBottom: `1px solid ${li.cardBorder}` }}>
    <div style={{ maxWidth: 1128, margin: "0 auto", minHeight: 56, display: "flex", alignItems: "center", gap: 10, padding: "0 16px", fontFamily: li.font }}>
      <button aria-label="Home" onClick={onHome} style={{ background: li.blue, color: "#fff", border: "none", fontWeight: 800, fontSize: 20, width: 34, height: 34, borderRadius: 6, cursor: "pointer" }}>in</button>
      <form onSubmit={submit} style={{ display: "flex", alignItems: "center", background: "#edf3f8", borderRadius: 5, padding: "0 8px", height: 34, width: "min(300px, 42vw)" }}>
        <input aria-label="Global search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search roles" style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: 14, fontFamily: li.font }} />
      </form>
      <div style={{ flex: 1 }} />
      <button onClick={onHome} style={navButton}>Home</button>
      <button onClick={() => onJobs?.()} style={navButton}>Jobs</button>
      <div style={{ position: "relative" }}>
        <button aria-expanded={open} onClick={() => setOpen(!open)} style={{ ...navButton, display: "flex", alignItems: "center", gap: 6 }}><span style={{ display: "inline-grid", placeItems: "center", width: 25, height: 25, borderRadius: "50%", background: li.blue, color: "#fff", fontSize: 12 }}>{initial}</span> Me</button>
        {open && <div role="menu" style={{ position: "absolute", right: 0, top: 42, width: 160, padding: 6, background: li.cardBg, border: `1px solid ${li.cardBorder}`, borderRadius: 8, boxShadow: li.cardShadow }}>
          <button role="menuitem" onClick={() => { setOpen(false); onProfile?.(); }} style={{ ...navButton, width: "100%", textAlign: "left" }}>View profile</button>
          <button role="menuitem" onClick={() => { setOpen(false); onRestart?.(); }} style={{ ...navButton, width: "100%", textAlign: "left" }}>Restart</button>
        </div>}
      </div>
    </div>
  </header>;
}
