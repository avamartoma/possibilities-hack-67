import { card, chip, ui } from "../../lib/explore/ui";
import type { UserProfile, UserSignals } from "../../lib/explore/types";

interface Props {
  users: UserProfile[];
  currentId: string;
  onChange: (id: string) => void;
  signals: UserSignals;
}

function eligibilityNote(s: UserSignals): string {
  const parts: string[] = [];
  if (s.latestGradYear === null) {
    parts.push("Student — showing entry-level roles");
  } else if (s.isRecentGrad) {
    parts.push(`Recent grad (${s.latestGradYear}) — entry & mid roles`);
  } else {
    parts.push(`Experienced (grad ${s.latestGradYear}) — all levels`);
  }
  parts.push(s.hasDegree ? "has a degree" : "no degree — degree-optional fields only");
  return parts.join(" · ");
}

export default function UserPicker({ users, currentId, onChange, signals }: Props) {
  const current = users.find((u) => u.id === currentId);
  const latestDegree = current?.school_history?.slice(-1)[0]?.degree;

  return (
    <section style={{ ...card, padding: 16, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <label style={{ fontWeight: 600, color: ui.color.text, fontFamily: ui.font }}>
          Viewing as
        </label>
        <select
          value={currentId}
          onChange={(e) => onChange(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: ui.radius,
            border: `1px solid ${ui.color.border}`,
            fontSize: 15,
            fontFamily: ui.font,
            background: "#fff",
          }}
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
              {u.school_history?.slice(-1)[0]?.degree
                ? ` — ${u.school_history.slice(-1)[0].degree}`
                : " — no degree"}
            </option>
          ))}
        </select>
        {latestDegree && (
          <span style={chip("neutral")}>🎓 {latestDegree}</span>
        )}
      </div>
      <p style={{ margin: "10px 0 0", color: ui.color.textSubtle, fontSize: 13.5, fontFamily: ui.font }}>
        {eligibilityNote(signals)}
      </p>
    </section>
  );
}
