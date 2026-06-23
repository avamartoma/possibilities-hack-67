"use client";

// Explore (Person A): hierarchical career discovery.
//   Interest bubble  ->  Field (industry)  ->  Job title  ->  Comparison page.
// What you see is filtered by your profile (grad-year seniority + degree),
// so each user explores only the roles realistically open to them.

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ui } from "../../lib/explore/ui";
import { getCatalog, getUsers } from "../../lib/explore/data";
import { BUBBLES, roleIdFor } from "../../lib/explore/taxonomy";
import { deriveUserSignals } from "../../lib/explore/eligibility";
import { eligibleCountForBubble, fieldsForBubble } from "../../lib/explore/buildTree";
import type { JobPosition } from "../../lib/explore/types";

import Breadcrumb, { Crumb } from "./Breadcrumb";
import UserPicker from "./UserPicker";
import BubbleGrid from "./BubbleGrid";
import FieldList from "./FieldList";
import RoleList from "./RoleList";
import RoleDetail from "./RoleDetail";
import ComparisonPanel from "../ComparisonPanel/ComparisonPanel";

export default function ExploreView() {
  const catalog = useMemo(() => getCatalog(), []);
  const users = useMemo(() => getUsers(), []);

  const [userId, setUserId] = useState(users[0]?.id ?? "");
  const [bubbleId, setBubbleId] = useState<string | null>(null);
  const [industry, setIndustry] = useState<string | null>(null);
  const [role, setRole] = useState<JobPosition | null>(null);

  const currentUser = users.find((u) => u.id === userId) ?? users[0];
  const signals = useMemo(() => deriveUserSignals(currentUser), [currentUser]);

  const bubbleItems = useMemo(
    () => BUBBLES.map((bubble) => ({ bubble, count: eligibleCountForBubble(catalog, bubble, signals) })),
    [catalog, signals]
  );

  const selectedBubble = BUBBLES.find((b) => b.id === bubbleId) ?? null;
  const fields = useMemo(
    () => (selectedBubble ? fieldsForBubble(catalog, selectedBubble, signals) : []),
    [catalog, selectedBubble, signals]
  );
  const positions = industry
    ? fields.find((f) => f.industry === industry)?.positions ?? []
    : [];

  // Switching user resets to the top so the "different worlds" effect is obvious.
  function changeUser(id: string) {
    setUserId(id);
    setBubbleId(null);
    setIndustry(null);
    setRole(null);
  }

  const goHome = () => { setBubbleId(null); setIndustry(null); setRole(null); };
  const goBubble = () => { setIndustry(null); setRole(null); };
  const goIndustry = () => setRole(null);

  const trail: Crumb[] = [{ label: "Explore", onClick: goHome }];
  if (selectedBubble) trail.push({ label: selectedBubble.label, onClick: goBubble });
  if (industry) trail.push({ label: industry, onClick: goIndustry });
  if (role) trail.push({ label: role.position });

  // Current level title + body.
  let title: string;
  let body: ReactNode;
  if (role) {
    const rid = roleIdFor(role);
    title = role.position;
    if (signals.fitCapable && rid) {
      body = <ComparisonPanel userId={userId} roleId={rid} />;
    } else {
      body = (
        <RoleDetail
          position={role}
          signals={signals}
          reason={!signals.fitCapable ? "not-fit-capable" : "no-canonical-role"}
        />
      );
    }
  } else if (selectedBubble && industry) {
    title = industry;
    body = <RoleList positions={positions} signals={signals} onSelect={setRole} />;
  } else if (selectedBubble) {
    title = selectedBubble.label;
    body = <FieldList fields={fields} onSelect={setIndustry} />;
  } else {
    title = "What are you into?";
    body = <BubbleGrid items={bubbleItems} onSelect={setBubbleId} />;
  }

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 20px 64px", fontFamily: ui.font }}>
      {/* Header band */}
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, color: ui.color.text }}>
          <span style={{ color: ui.color.blue }}>Career</span> Explore
        </h1>
        <p style={{ margin: "4px 0 0", color: ui.color.textSubtle, fontSize: 15 }}>
          Discover roles you’d never have searched for — filtered to what’s open to you.
        </p>
      </header>

      <UserPicker users={users} currentId={userId} onChange={changeUser} signals={signals} />

      <Breadcrumb trail={trail} />

      <h2 style={{ fontSize: 20, color: ui.color.text, margin: "0 0 16px" }}>{title}</h2>
      {body}
    </div>
  );
}
