"use client";

// Integrated flow:
//   Lock In → Explore careers → Comparison → "Build my path" → Milestone.

import { useMemo, useState } from "react";
import { li } from "../../lib/theme";
import LinkedInNav from "../LinkedInNav";
import ProfilePage from "../Profile/ProfilePage";
import ExploreView from "../Explore/ExploreView";
import ComparisonPanel from "../ComparisonPanel/ComparisonPanel";
import MilestoneView from "../Milestone/MilestoneView";
import type { UserProfile } from "../../lib/explore/types";
import flowUsersData from "../../data/flowUsers.json";

const FLOW_USERS = flowUsersData as unknown as UserProfile[];

type Step = "landing" | "explore" | "comparison" | "milestone";

const wrap: React.CSSProperties = { maxWidth: 1128, margin: "0 auto", padding: "24px 16px" };

export default function AppFlow() {
  const [step, setStep] = useState<Step>("landing");
  const [userId, setUserId] = useState(
    FLOW_USERS.find((u) => (u as { hero?: boolean }).hero)?.id ?? FLOW_USERS[0]?.id ?? ""
  );
  const [roleId, setRoleId] = useState<string | null>(null);
  const [roleTitle, setRoleTitle] = useState<string>("");
  const [missingSkills, setMissingSkills] = useState<string[]>([]);

  const user = useMemo(
    () => FLOW_USERS.find((u) => u.id === userId) ?? FLOW_USERS[0],
    [userId]
  );

  function pickRole(rid: string | null, title: string) {
    setRoleId(rid);
    setRoleTitle(title);
    setStep("comparison");
  }

  return (
    <div style={{ background: li.pageBg, minHeight: "100vh", fontFamily: li.font }}>
      <LinkedInNav userName={user?.name} />

      {step === "landing" && (
        <ProfilePage onLockIn={() => setStep("explore")} />
      )}

      {step === "explore" && (
        <div style={wrap}>
          <BackBar label="Back to profile" onBack={() => setStep("landing")} />
          <ExploreView
            users={FLOW_USERS}
            userId={userId}
            onUserChange={setUserId}
            onPickRole={(rid, position) => pickRole(rid, position.position)}
            showHeader={false}
          />
        </div>
      )}

      {step === "comparison" && (
        <div style={wrap}>
          <BackBar label="Back to Explore" onBack={() => setStep("explore")} />
          {roleId ? (
            <ComparisonPanel
              userId={userId}
              roleId={roleId}
              onBuildPath={({ missingSkills: m }) => { setMissingSkills(m); setStep("milestone"); }}
            />
          ) : (
            <NoFitNotice title={roleTitle} onBack={() => setStep("explore")} />
          )}
        </div>
      )}

      {step === "milestone" && (
        <Milestone
          roleTitle={roleTitle}
          roleId={roleId}
          userId={userId}
          missingSkills={missingSkills}
          onBack={() => setStep("comparison")}
        />
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

function NoFitNotice({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div style={{ background: li.cardBg, borderRadius: li.cardRadius, boxShadow: li.cardShadow, padding: 28, maxWidth: 760, fontFamily: li.font }}>
      <h2 style={{ marginTop: 0, color: li.textPrimary }}>{title}</h2>
      <p style={{ color: li.textSecondary }}>
        A full fit comparison for this role is coming soon. Pick another role to see the comparison.
      </p>
      <button onClick={onBack} style={{ background: li.blue, color: "#fff", border: "none", borderRadius: 999, padding: "8px 20px", fontWeight: 600, cursor: "pointer", fontFamily: li.font }}>
        &larr; Back
      </button>
    </div>
  );
}

function Milestone({
  roleTitle, roleId, userId, missingSkills, onBack,
}: { roleTitle: string; roleId: string | null; userId: string; missingSkills: string[]; onBack: () => void }) {
  return (
    <div style={wrap}>
      <BackBar label="Back to comparison" onBack={onBack} />
      <div style={{ background: li.cardBg, borderRadius: li.cardRadius, boxShadow: li.cardShadow, padding: "16px 20px", marginBottom: 16 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, color: li.textPrimary }}>
          Your path to {roleTitle || "your goal role"}
        </h2>
        <p style={{ margin: 0, color: li.textSecondary, fontSize: 14 }}>
          {missingSkills.length
            ? <>Closing the gap on: {missingSkills.map((s) => (
                <span key={s} style={{ background: li.amberBg, color: li.amber, borderRadius: 999, padding: "2px 10px", fontSize: 12, fontWeight: 600, margin: "0 4px 0 0", display: "inline-block" }}>{s}</span>
              ))}</>
            : "A personalized milestone plan to get you there."}
        </p>
      </div>
      {roleId && <MilestoneView userId={userId} roleId={roleId} />}
    </div>
  );
}
