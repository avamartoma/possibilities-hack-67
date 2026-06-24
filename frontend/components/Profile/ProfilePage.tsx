"use client";

// The first screen of the flow: a realistic LinkedIn-style profile page for the
// most data-rich user in sample_data/user_data.json (user_2340, "Bob Smith").
// Renders the bundled rich profile (frontend/data/profile.json) as the standard
// LinkedIn sections — intro, About, Activity, Experience, Education, Licenses &
// certifications, Skills — and carries the product's "Lock In" entry CTA.

import { li } from "../../lib/theme";
import profileData from "../../data/profile.json";

// ---- Shape of frontend/data/profile.json (generated from user_data.json) ----
interface ExperienceItem {
  title: string;
  company: string;
  employment_type: string;
  start: string;
  end: string;
  location: string;
  description: string;
  skills: string[];
}
interface EducationItem {
  school: string;
  degree: string;
  field: string;
  graduation_year: number;
}
interface LicenseItem {
  name: string;
  issuer: string;
  issued: string;
  credential_id?: string;
  skills: string[];
}
interface ActivityItem {
  text: string;
  posted: string;
  reactions: number;
  comments: number;
}
interface Profile {
  id: string;
  name: string;
  headline: string;
  location: string;
  openToWork: boolean;
  openToRoles: string[];
  connections: number;
  about: string;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  licenses: LicenseItem[];
  activity: ActivityItem[];
}

const profile = profileData as Profile;

const COL = 760;

export default function ProfilePage({ onLockIn }: { onLockIn: () => void }) {
  return (
    <main style={{ maxWidth: COL, margin: "0 auto", padding: "24px 16px", fontFamily: li.font }}>
      <IntroCard onLockIn={onLockIn} />
      <AboutCard />
      <ActivityCard />
      <ExperienceCard />
      <EducationCard />
      <LicensesCard />
      <SkillsCard />
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

function Initial({ name, size = 40, square = false }: { name: string; size?: number; square?: boolean }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: square ? 8 : "50%",
        background: li.blueLight,
        color: li.blue,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.42,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function SkillChip({ label }: { label: string }) {
  return (
    <span
      style={{
        background: li.blueLight,
        color: li.blue,
        borderRadius: 999,
        padding: "4px 12px",
        fontSize: 13,
        fontWeight: 600,
        display: "inline-block",
      }}
    >
      {label}
    </span>
  );
}

function Divider() {
  return <hr style={{ border: "none", borderTop: `1px solid ${li.cardBorder}`, margin: "16px 0" }} />;
}

/* ------------------------------- sections -------------------------------- */

function IntroCard({ onLockIn }: { onLockIn: () => void }) {
  const connLabel = profile.connections >= 500 ? "500+ connections" : `${profile.connections} connections`;
  return (
    <section style={cardStyle}>
      {/* Cover banner */}
      <div style={{ height: 134, background: `linear-gradient(120deg, ${li.blue}, #378fe9)` }} />
      <div style={{ padding: "0 24px 24px" }}>
        {/* Avatar overlapping the banner */}
        <div style={{ marginTop: -76, marginBottom: 8 }}>
          <div
            style={{
              width: 152,
              height: 152,
              borderRadius: "50%",
              background: li.blue,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 60,
              fontWeight: 700,
              border: `4px solid ${li.cardBg}`,
            }}
          >
            {profile.name.charAt(0).toUpperCase()}
          </div>
        </div>

        <h1 style={{ margin: "0 0 2px", fontSize: 26, fontWeight: 600, color: li.textPrimary }}>
          {profile.name}
        </h1>
        <p style={{ margin: "0 0 6px", fontSize: 16, color: li.textPrimary, lineHeight: 1.4 }}>
          {profile.headline}
        </p>
        <p style={{ margin: 0, fontSize: 14, color: li.textSecondary }}>
          {profile.location} ·{" "}
          <span style={{ color: li.blue, fontWeight: 600 }}>{connLabel}</span>
        </p>

        {/* Open to work banner */}
        {profile.openToWork && (
          <div
            style={{
              marginTop: 16,
              background: li.greenBg,
              borderRadius: 8,
              padding: "12px 16px",
              fontSize: 14,
              color: li.textPrimary,
            }}
          >
            <strong style={{ color: li.green }}>Open to work</strong>
            <div style={{ color: li.textSecondary, marginTop: 2 }}>
              {profile.openToRoles.join(", ")} roles
            </div>
          </div>
        )}

        {/* Action row — the product's entry CTA lives here */}
        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          <button
            onClick={onLockIn}
            style={{
              background: li.blue,
              color: "#fff",
              border: "none",
              borderRadius: 999,
              padding: "10px 28px",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: li.font,
            }}
          >
            Lock In →
          </button>
          <button
            style={{
              background: "transparent",
              color: li.blue,
              border: `1px solid ${li.blue}`,
              borderRadius: 999,
              padding: "10px 22px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: li.font,
            }}
          >
            Open to
          </button>
          <button
            style={{
              background: "transparent",
              color: li.textSecondary,
              border: `1px solid ${li.textSecondary}`,
              borderRadius: 999,
              padding: "10px 22px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: li.font,
            }}
          >
            More
          </button>
        </div>
      </div>
    </section>
  );
}

function AboutCard() {
  return (
    <SectionCard title="About">
      <p style={{ margin: 0, color: li.textPrimary, lineHeight: 1.6, fontSize: 15, whiteSpace: "pre-line" }}>
        {profile.about}
      </p>
    </SectionCard>
  );
}

function ActivityCard() {
  return (
    <SectionCard title="Activity">
      <p style={{ margin: "-8px 0 14px", color: li.textSecondary, fontSize: 13 }}>
        {profile.connections >= 500 ? "500+" : profile.connections} followers
      </p>
      <div>
        {profile.activity.map((a, i, arr) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 12,
              padding: "12px 0",
              borderBottom: i < arr.length - 1 ? `1px solid ${li.cardBorder}` : "none",
            }}
          >
            <Initial name={profile.name} size={44} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, color: li.textSecondary }}>
                <strong style={{ color: li.textPrimary }}>{profile.name}</strong> posted this ·{" "}
                {a.posted}
              </div>
              <p style={{ margin: "4px 0 6px", fontSize: 15, color: li.textPrimary, lineHeight: 1.5 }}>
                {a.text}
              </p>
              <div style={{ fontSize: 12, color: li.textHint }}>
                👍 {a.reactions} · {a.comments} comments
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function ExperienceCard() {
  return (
    <SectionCard title="Experience">
      {profile.experience.map((e, i, arr) => (
        <div key={i}>
          <div style={{ display: "flex", gap: 12 }}>
            <Initial name={e.company} size={48} square />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: li.textPrimary }}>{e.title}</div>
              <div style={{ fontSize: 14, color: li.textPrimary }}>
                {e.company} · {e.employment_type}
              </div>
              <div style={{ fontSize: 13, color: li.textSecondary }}>
                {e.start} – {e.end}
              </div>
              <div style={{ fontSize: 13, color: li.textSecondary }}>{e.location}</div>
              <p style={{ margin: "8px 0 0", fontSize: 14, color: li.textPrimary, lineHeight: 1.5 }}>
                {e.description}
              </p>
              {e.skills.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {e.skills.map((s) => (
                    <SkillChip key={s} label={s} />
                  ))}
                </div>
              )}
            </div>
          </div>
          {i < arr.length - 1 && <Divider />}
        </div>
      ))}
    </SectionCard>
  );
}

function EducationCard() {
  return (
    <SectionCard title="Education">
      {profile.education.map((ed, i, arr) => (
        <div key={i}>
          <div style={{ display: "flex", gap: 12 }}>
            <Initial name={ed.school} size={48} square />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: li.textPrimary }}>{ed.school}</div>
              <div style={{ fontSize: 14, color: li.textPrimary }}>{ed.degree}</div>
              <div style={{ fontSize: 13, color: li.textSecondary }}>
                Graduated {ed.graduation_year}
              </div>
            </div>
          </div>
          {i < arr.length - 1 && <Divider />}
        </div>
      ))}
    </SectionCard>
  );
}

function LicensesCard() {
  return (
    <SectionCard title="Licenses & certifications">
      {profile.licenses.map((l, i, arr) => (
        <div key={i}>
          <div style={{ display: "flex", gap: 12 }}>
            <Initial name={l.issuer} size={48} square />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: li.textPrimary }}>{l.name}</div>
              <div style={{ fontSize: 14, color: li.textPrimary }}>{l.issuer}</div>
              <div style={{ fontSize: 13, color: li.textSecondary }}>Issued {l.issued}</div>
              {l.credential_id && (
                <div style={{ fontSize: 13, color: li.textSecondary }}>
                  Credential ID {l.credential_id}
                </div>
              )}
              {l.skills.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {l.skills.map((s) => (
                    <SkillChip key={s} label={s} />
                  ))}
                </div>
              )}
            </div>
          </div>
          {i < arr.length - 1 && <Divider />}
        </div>
      ))}
    </SectionCard>
  );
}

function SkillsCard() {
  return (
    <SectionCard title="Skills">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {profile.skills.map((s) => (
          <SkillChip key={s} label={s} />
        ))}
      </div>
    </SectionCard>
  );
}
