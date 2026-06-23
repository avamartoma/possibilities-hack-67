"use client";

// LinkedIn-style global top navigation bar. Visual chrome only — wraps the
// comparison page so the demo reads as a real LinkedIn screen.

import { li } from "../lib/theme";

function NavIcon({ label, path }: { label: string; path: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: li.textSecondary,
        fontSize: 12,
        minWidth: 80,
        cursor: "pointer",
        gap: 2,
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d={path} />
      </svg>
      <span>{label}</span>
    </div>
  );
}

// Minimal glyphs approximating LinkedIn's nav icons.
const ICONS = {
  home: "M23 9v2h-2v7a3 3 0 01-3 3h-4v-6h-2v6H6a1 1 0 01-1-1v-9H3V9l9-7 5 3.9V3h3v4.5l3 1.5z",
  network:
    "M12 16v-1a5 5 0 00-10 0v1h10zM7 13a3 3 0 100-6 3 3 0 000 6zm14 3v-1a4 4 0 00-3-3.87A3 3 0 0014 7a4 4 0 00-1 .13 5 5 0 011 3 6 6 0 01.34 2H21z",
  jobs: "M17 6V5a3 3 0 00-3-3h-4a3 3 0 00-3 3v1H2v5h20V6h-5zm-7-1a1 1 0 011-1h2a1 1 0 011 1v1h-4V5zM2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6H2z",
  messaging:
    "M16 4H8a7 7 0 000 14h1v3l5.16-3.43A7 7 0 0016 4z",
  notifications:
    "M22 19h-8.28a2 2 0 11-3.44 0H2v-1a4.52 4.52 0 011.17-2.83l.83-.95V8a8 8 0 1116 0v6.22l.83 1A4.46 4.46 0 0122 18z",
};

export default function LinkedInNav({
  userName,
}: {
  userName?: string;
}) {
  const initial = (userName ?? "Y").trim().charAt(0).toUpperCase();
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: li.cardBg,
        borderBottom: `1px solid ${li.cardBorder}`,
        boxShadow: "0 0 0 1px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          maxWidth: 1128,
          margin: "0 auto",
          height: 52,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 16px",
          fontFamily: li.font,
        }}
      >
        {/* Logo */}
        <div
          style={{
            background: li.blue,
            color: "#fff",
            fontWeight: 800,
            fontSize: 22,
            width: 34,
            height: 34,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: li.font,
          }}
        >
          in
        </div>

        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#edf3f8",
            borderRadius: 4,
            padding: "0 8px",
            height: 34,
            width: 280,
            color: li.textSecondary,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span style={{ fontSize: 14 }}>Search</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Nav icons */}
        <NavIcon label="Home" path={ICONS.home} />
        <NavIcon label="My Network" path={ICONS.network} />
        <NavIcon label="Jobs" path={ICONS.jobs} />
        <NavIcon label="Messaging" path={ICONS.messaging} />
        <NavIcon label="Notifications" path={ICONS.notifications} />

        {/* Me / avatar */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontSize: 12,
            color: li.textSecondary,
            minWidth: 80,
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: li.blue,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {initial}
          </div>
          <span>Me ▾</span>
        </div>
      </div>
    </header>
  );
}
