"use client";

import { li } from "../../lib/theme";

function Column({ title, skills, kind }: { title: string; skills: string[]; kind: "have" | "missing" }) {
  const have = kind === "have";
  return <div style={{ flex: 1, minWidth: 0 }}><h3 style={{ margin: "0 0 12px", fontSize: 16 }}>{title} <span style={{ color: li.textSecondary, fontWeight: 400 }}>({skills.length})</span></h3>{skills.length ? <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>{skills.map((skill) => <li key={skill} style={{ background: have ? li.greenBg : li.pageBg, color: have ? li.green : li.textPrimary, border: `1px solid ${have ? "rgba(5,118,66,.2)" : li.cardBorder}`, borderRadius: 16, padding: "6px 12px", marginBottom: 8, fontWeight: 600, fontSize: 14, overflowWrap: "anywhere" }}>{skill}</li>)}</ul> : <p style={{ color: have ? li.textHint : li.green, fontSize: 14 }}>{have ? "None yet — this is a fresh start." : "You have every listed skill."}</p>}</div>;
}
export default function SkillColumns({ haveSkills, missingSkills }: { haveSkills: string[]; missingSkills: string[] }) { return <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontFamily: li.font }}><Column title="Skills you have" skills={haveSkills} kind="have" /><Column title="Skills to build" skills={missingSkills} kind="missing" /></div>; }
