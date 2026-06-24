"use client";

// First screen of the flow: a LinkedIn-style profile page rendered entirely from
// the normalized v2 UserProfile (GET /api/profile/:id), not bundled JSON. The
// canonical demo identity is user_2340 ("Bob Smith"). Layout/visual design is
// preserved from the original bundled-JSON version — only the data source changed.

import { li } from "../../lib/theme";
import type { UserProfile } from "../../lib/types";

interface ExperienceItem {
  title?: string;
  company?: string;
  employmentType?: string;
  start?: string;
  end?: string;
  location?: string;
  description?: string;
  skills?: string[];
}
interface EducationItem {
  school?: string;
  degree?: string;
  field?: string;
  graduationYear?: number;
}

const COL = 760;

export default function ProfilePage({ profile, onLockIn }: { profile: UserProfile; onLockIn: () => void }) {
  const experience = profile.experience as unknown as ExperienceItem[];
  const education = profile.education as unknown as EducationItem[];
  return (
    <main style={{ maxWidth: COL, margin: "0 auto", padding: "24px 16px", fontFamily: li.font }}>
      <IntroCard profile={profile} onLockIn={onLockIn} />
      {experience.length > 0 && (
        <SectionCard title="Experience">
          {experience.map((e, i) => (
            <div key={i}>
              <div style={{ display: "flex", gap: 12 }}>
                <Initial name={e.company ?? e.title ?? "?"} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: li.textPrimary }}>{e.title}</div>
                  <div style={{ fontSize: 14, color: li.textPrimary }}>
                    {e.company}{e.employmentType ? ` · ${e.employmentType}` : ""}
                  </div>
                  {(e.start || e.end) && (
                    <div style={{ fontSize: 13, color: li.textSecondary }}>{e.start} – {e.end}</div>
                  )}
                  {e.location && <div style={{ fontSize: 13, color: li.textSecondary }}>{e.location}</div>}
                  {e.description && (
                    <p style={{ margin: "8px 0 0", fontSize: 14, color: li.textPrimary, lineHeight: 1.5 }}>{e.description}</p>
                  )}
                  {(e.skills?.length ?? 0) > 0 && (
                    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {e.skills!.map((s) => <SkillChip key={s} label={s} />)}
                    </div>
                  )}
                </div>
              </div>
              {i < experience.length - 1 && <Divider />}
            </div>
          ))}
        </SectionCard>
      )}
      {education.length > 0 && (
        <SectionCard title="Education">
          {education.map((ed, i) => (
            <div key={i}>
              <div style={{ display: "flex", gap: 12 }}>
                <Initial name={ed.school ?? ed.field ?? "?"} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: li.textPrimary }}>{ed.school}</div>
                  <div style={{ fontSize: 14, color: li.textPrimary }}>{ed.degree ?? ed.field}</div>
                  {ed.graduationYear && (
                    <div style={{ fontSize: 13, color: li.textSecondary }}>Graduated {ed.graduationYear}</div>
                  )}
                </div>
              </div>
              {i < education.length - 1 && <Divider />}
            </div>
          ))}
        </SectionCard>
      )}
      {profile.skills.length > 0 && (
        <SectionCard title="Skills">
          <ChipRow items={profile.skills} />
        </SectionCard>
      )}
      {profile.interests.length > 0 && (
        <SectionCard title="Interests">
          <ChipRow items={profile.interests} />
        </SectionCard>
      )}
      {profile.savedGoals.length > 0 && (
        <SectionCard title="Saved goals">
          <ul style={{ margin: 0, paddingLeft: 18, color: li.textPrimary, fontSize: 15, lineHeight: 1.6 }}>
            {profile.savedGoals.map((g) => <li key={g}>{g}</li>)}
          </ul>
        </SectionCard>
      )}
      <p style={{ textAlign: "center", color: li.textHint, fontSize: 13, margin: "16px 0 8px" }}>
        Career discovery, built around your profile.
      </p>
    </main>
  );
}

/* ----------------------------- shared pieces ----------------------------- */

const cardStyle: React.CSSProperties = {
  background: li.cardBg,
  borderRadius: li.cardRadius,
  boxShadow: li.cardShadow,
  border: `1px solid ${li.cardBorder}`,
  marginBottom: 16,
  overflow: "hidden",
};

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ ...cardStyle, padding: "20px 24px" }}>
      <h2 style={{ margin: "0 0 14px", fontSize: 20, fontWeight: 600, color: li.textPrimary }}>{title}</h2>
      {children}
    </section>
  );
}

function ChipRow({ items }: { items: string[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {items.map((s) => <SkillChip key={s} label={s} />)}
    </div>
  );
}

function Initial({ name }: { name: string }) {
  return (
    <div
      style={{
        width: 48, height: 48, borderRadius: 8,
        background: li.blueLight, color: li.blue, display: "flex",
        alignItems: "center", justifyContent: "center",
        fontSize: 20, fontWeight: 700, flexShrink: 0,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function SkillChip({ label }: { label: string }) {
  return (
    <span style={{ background: li.blueLight, color: li.blue, borderRadius: 999, padding: "4px 12px", fontSize: 13, fontWeight: 600, display: "inline-block" }}>
      {label}
    </span>
  );
}

function Divider() {
  return <hr style={{ border: "none", borderTop: `1px solid ${li.cardBorder}`, margin: "16px 0" }} />;
}

function IntroCard({ profile, onLockIn }: { profile: UserProfile; onLockIn: () => void }) {
  return (
    <section style={cardStyle}>
      <div style={{ height: 134, background: `linear-gradient(120deg, ${li.blue}, #378fe9)` }} />
      <div style={{ padding: "0 24px 24px" }}>
        <div style={{ marginTop: -76, marginBottom: 8 }}>
          <div
            style={{
              width: 152, height: 152, borderRadius: "50%", background: li.blue, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 60, fontWeight: 700, border: `4px solid ${li.cardBg}`,
            }}
          >
            {profile.name.charAt(0).toUpperCase()}
          </div>
        </div>

        <h1 style={{ margin: "0 0 2px", fontSize: 26, fontWeight: 600, color: li.textPrimary }}>{profile.name}</h1>
        <p style={{ margin: "0 0 6px", fontSize: 16, color: li.textPrimary, lineHeight: 1.4 }}>{profile.headline}</p>
        {profile.location && (
          <p style={{ margin: 0, fontSize: 14, color: li.textSecondary }}>{profile.location}</p>
        )}

        <div style={{ marginTop: 16, background: li.greenBg, borderRadius: 8, padding: "12px 16px", fontSize: 14, color: li.textPrimary }}>
          <strong style={{ color: li.green }}>{profile.currentStatus}</strong>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          <button
            onClick={onLockIn}
            aria-label="Continue your career journey"
            style={{ background: li.blue, color: "#fff", border: "none", borderRadius: 999, padding: "10px 28px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: li.font }}
          >
            Locked<span aria-hidden="true" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 17, height: 17, marginLeft: 4, borderRadius: 2, background: "#0a66c2", color: "#fff", fontSize: 13, lineHeight: 1, fontWeight: 800 }}>in</span>
          </button>
        </div>
      </div>
    </section>
  );
}
