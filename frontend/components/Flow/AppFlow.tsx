"use client";

// Integrated flow coordinator. Selecting a role always opens the single Your Path
// destination; origin is retained only so the back action is unsurprising.

import { useCallback, useEffect, useState } from "react";
import { li } from "../../lib/theme";
import { getProfile } from "../../lib/api";
import { clearSession, clearUserProgress, loadSession, saveSession, type FlowStep } from "../../lib/persistence";
import type { UserProfile } from "../../lib/types";
import LinkedInNav from "../LinkedInNav";
import ProfilePage from "../Profile/ProfilePage";
import ExploreView from "../Explore/ExploreView";
import ExplainView from "../Explain/ExplainView";
import MilestoneView from "../Milestone/MilestoneView";

export const DEFAULT_USER_ID = "user_2340";

type Step = "landing" | FlowStep;
type Origin = "explore" | "explain";
type Status = "loading" | "error" | "ready";

const wrap: React.CSSProperties = { maxWidth: 1128, margin: "0 auto", padding: "24px 16px" };

export default function AppFlow() {
  const [step, setStep] = useState<Step>("landing");
  const [userId] = useState(DEFAULT_USER_ID);
  const [roleId, setRoleId] = useState<string | null>(null);
  const [origin, setOrigin] = useState<Origin>("explore");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [saved, setSaved] = useState<ReturnType<typeof loadSession>>(null);
  const [discoverQuery, setDiscoverQuery] = useState("");

  const loadProfile = useCallback(() => {
    let active = true;
    setStatus("loading");
    getProfile(userId)
      .then((p) => { if (active) { setProfile(p); setStatus("ready"); } })
      .catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, [userId]);

  useEffect(() => loadProfile(), [loadProfile]);
  useEffect(() => { setSaved(loadSession()); }, []);

  function go(next: FlowStep, nextRole = roleId, nextOrigin = origin) {
    setStep(next); setRoleId(nextRole); setOrigin(nextOrigin);
    const value = { userId, step: next, ...(nextRole ? { roleId: nextRole } : {}), ...(next === "milestone" ? { origin: nextOrigin } : {}) };
    saveSession(value); setSaved(value);
  }

  function selectRole(rid: string, from: Origin) {
    go("milestone", rid, from);
  }

  return (
    <div style={{ background: li.pageBg, minHeight: "100vh", fontFamily: li.font }}>
      <LinkedInNav userName={profile?.name} onHome={() => setStep("landing")} onProfile={() => setStep("landing")} onJobs={(query) => { setDiscoverQuery(query || ""); go("explore"); }} onRestart={() => { clearSession(); clearUserProgress(userId); setSaved(null); setRoleId(null); setStep("landing"); }} />

      {step === "landing" && (
        status === "loading" ? <CenterNotice>Loading your profile…</CenterNotice>
        : status === "error" ? <ErrorNotice onRetry={loadProfile} />
        : <ProfilePage profile={profile!} onLockIn={() => saved ? go(saved.step, saved.roleId ?? null, saved.origin ?? "explore") : go("explore")} />
      )}

      {step === "explore" && (
        <div style={wrap}>
          <BackBar label="Back to profile" onBack={() => setStep("landing")} />
          <ExploreView
            userId={userId}
            initialQuery={discoverQuery}
            onSelectRole={(rid) => selectRole(rid, "explore")}
            onOpenGuide={() => go("explain")}
          />
        </div>
      )}

      {step === "explain" && (
        <div style={wrap}>
          <BackBar label="Back to Explore" onBack={() => go("explore")} />
          <ExplainView userId={userId} onSelectRole={(rid) => selectRole(rid, "explain")} />
        </div>
      )}

      {step === "milestone" && (
        <div style={{ ...wrap, maxWidth: 760 }}>
          <BackBar label={origin === "explore" ? "Back to Discover" : "Back to Career Guide"} onBack={() => go(origin)} />
          <MilestoneView userId={userId} roleId={roleId!} onCompare={() => { window.location.href = `/comparison?user=${encodeURIComponent(userId)}&role=${encodeURIComponent(roleId!)}`; }} />
        </div>
      )}
    </div>
  );
}

function BackBar({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <button
      onClick={onBack}
      style={{ background: "none", border: "none", color: li.blue, fontWeight: 600, cursor: "pointer", fontSize: 14, padding: "0 0 14px", fontFamily: li.font }}
    >
      &larr; {label}
    </button>
  );
}

function CenterNotice({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ ...wrap, textAlign: "center", color: li.textSecondary, paddingTop: 80 }}>{children}</div>
  );
}

function ErrorNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ ...wrap, textAlign: "center", paddingTop: 80 }}>
      <p style={{ color: li.textPrimary, fontWeight: 600 }}>We couldn’t load your profile.</p>
      <button
        onClick={onRetry}
        style={{ background: li.blue, color: "#fff", border: "none", borderRadius: 999, padding: "8px 20px", fontWeight: 600, cursor: "pointer", fontFamily: li.font }}
      >
        Retry
      </button>
    </div>
  );
}
