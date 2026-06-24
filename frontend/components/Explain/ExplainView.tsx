"use client";

import { useEffect, useState } from "react";
import { li } from "../../lib/theme";
import { careerGuideChat, exploreBreadth } from "../../lib/api";
import type { CareerGuideMessage, ExploreRole } from "../../lib/types";

const PROMPTS = ["I like AI but do not want to code all day", "I want something creative and high paying", "I want a technical job that is people-facing"];
const button: React.CSSProperties = { background: li.blue, color: "#fff", border: "none", borderRadius: 999, padding: "8px 16px", fontWeight: 600, cursor: "pointer", fontFamily: li.font };
const card: React.CSSProperties = { background: li.cardBg, borderRadius: li.cardRadius, boxShadow: li.cardShadow, padding: 20 };

interface Props { userId: string; onSelectRole: (roleId: string) => void; }

export default function ExplainView({ userId, onSelectRole }: Props) {
  const [roles, setRoles] = useState<ExploreRole[] | null>(null);
  const [rolesError, setRolesError] = useState(false);
  const [messages, setMessages] = useState<CareerGuideMessage[]>([{ role: "assistant", content: "I’ll help you turn what you already know into a practical next direction. What kind of work gives you energy?" }]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  function loadRoles() {
    setRolesError(false); setRoles(null);
    exploreBreadth({ userId, limit: 8 }).then((r) => setRoles(r.exploratoryRoles)).catch(() => setRolesError(true));
  }
  useEffect(() => { loadRoles(); }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function send(content = draft) {
    const text = content.trim(); if (!text || pending) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next); setDraft(""); setPending(true); setFailed(false);
    try {
      const result = await careerGuideChat({ userId, messages: next });
      setMessages([...next, { role: "assistant", content: result.message, mode: result.mode, suggestedRoleIds: result.suggestedRoleIds }]);
    } catch { setMessages(next); setFailed(true); }
    finally { setPending(false); }
  }

  return <div style={{ display: "grid", gap: 16, fontFamily: li.font, minWidth: 0, width: "min(100%, 760px)", margin: "0 auto" }}>
    <section style={card}>
      <h1 style={{ margin: "0 0 4px", fontSize: 20, color: li.textPrimary }}>Start here</h1>
      <p style={{ margin: "0 0 12px", color: li.textSecondary, fontSize: 13 }}>A few nearby directions worth exploring.</p>
      {rolesError ? <button onClick={loadRoles} style={button}>Retry roles</button> : roles === null ? <p style={{ margin: 0, color: li.textHint }}>Finding directions…</p> : roles.length === 0 ? <p style={{ margin: 0, color: li.textHint }}>No directions are available yet.</p> :
        <div style={{ display: "flex", gap: 10, overflowX: "auto", maxWidth: "100%" }} data-testid="curiosity-scroll">{roles.map((item) => <article key={item.role.id} style={{ flex: "0 0 min(220px, calc(100vw - 64px))", border: `1px solid ${li.cardBorder}`, borderRadius: 10, padding: 12 }}><strong>{item.role.name}</strong><p style={{ margin: "5px 0", fontSize: 12, color: li.textSecondary }}>{item.exploreReason}</p><button onClick={() => onSelectRole(item.role.id)} style={{ ...button, padding: "6px 12px", fontSize: 12 }}>View path</button></article>)}</div>}
    </section>
    <section style={{ ...card, minWidth: 0 }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 20 }}>Career Guide</h2>
      <p style={{ margin: "0 0 12px", color: li.textSecondary, fontSize: 13 }}>Ask for a direction, tradeoff, or next step.</p>
      <div aria-live="polite" style={{ display: "grid", gap: 10, marginBottom: 14 }}>{messages.map((message, index) => <div key={index} style={{ justifySelf: message.role === "user" ? "end" : "start", maxWidth: "88%", background: message.role === "user" ? li.blue : li.pageBg, color: message.role === "user" ? "#fff" : li.textPrimary, padding: "10px 12px", borderRadius: 12, whiteSpace: "pre-wrap", fontSize: 14, minWidth: 0, overflowWrap: "anywhere" }}><div>{message.content}</div>{message.mode === "fallback" && <div style={{ marginTop: 5, color: message.role === "user" ? "#fff" : li.amber, fontSize: 11 }}>Using deterministic guidance</div>}{message.suggestedRoleIds?.map((id) => <button key={id} onClick={() => onSelectRole(id)} style={{ display: "block", marginTop: 8, ...button, padding: "6px 10px", fontSize: 12 }}>{roleLabel(id)} path</button>)}</div>)}{pending && <div style={{ color: li.textSecondary, fontSize: 13 }}>Thinking…</div>}</div>
      {failed && <div style={{ color: li.amber, fontSize: 13, marginBottom: 8 }}>Couldn’t reach the guide. <button onClick={() => send(messages.at(-1)?.content || "")} style={{ ...button, padding: "4px 10px", fontSize: 12 }}>Retry</button></div>}
      <form onSubmit={(e) => { e.preventDefault(); send(); }}><textarea aria-label="Career prompt" value={draft} onChange={(e) => setDraft(e.target.value.slice(0, 800))} placeholder="I want to work with robotics, but I don’t know what role fits me." rows={2} style={{ width: "100%", boxSizing: "border-box", padding: 10, borderRadius: 8, border: `1px solid ${li.cardBorder}`, fontFamily: li.font, resize: "vertical" }} /><div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 8 }}>{PROMPTS.map((prompt) => <button key={prompt} type="button" onClick={() => setDraft(prompt)} style={{ background: li.pageBg, border: `1px solid ${li.cardBorder}`, borderRadius: 999, padding: "5px 9px", fontSize: 12, cursor: "pointer" }}>{prompt}</button>)}<button type="submit" disabled={!draft.trim() || pending} style={{ ...button, marginLeft: "auto", opacity: !draft.trim() || pending ? .6 : 1 }}>Send</button></div></form>
    </section>
  </div>;
}

function roleLabel(id: string) { return id.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" "); }
