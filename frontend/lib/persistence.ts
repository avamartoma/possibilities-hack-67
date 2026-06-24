export type FlowStep = "explore" | "explain" | "comparison" | "milestone";
export type SavedSession = { userId: string; step: FlowStep; roleId?: string; origin?: "explore" | "explain" };
export type Progress = { completedOrders: number[]; lastCheckedAt: string | null };

const SESSION_KEY = "career-map:v4.5:session";
const progressKey = (userId: string, roleId: string) => `career-map:v4.5:progress:${userId}:${roleId}`;
const canUseStorage = () => typeof window !== "undefined" && !!window.localStorage;

export function loadSession(): SavedSession | null {
  if (!canUseStorage()) return null;
  try {
    const value = JSON.parse(window.localStorage.getItem(SESSION_KEY) || "null");
    if (!value || !["explore", "explain", "comparison", "milestone"].includes(value.step) || typeof value.userId !== "string") return null;
    if (["comparison", "milestone"].includes(value.step) && typeof value.roleId !== "string") return null;
    return value;
  } catch { return null; }
}
export function saveSession(session: SavedSession) { if (canUseStorage()) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session)); }
export function clearSession() { if (canUseStorage()) window.localStorage.removeItem(SESSION_KEY); }
export function loadProgress(userId: string, roleId: string): Progress {
  if (!canUseStorage()) return { completedOrders: [], lastCheckedAt: null };
  try {
    const value = JSON.parse(window.localStorage.getItem(progressKey(userId, roleId)) || "null");
    return value && Array.isArray(value.completedOrders) ? { completedOrders: value.completedOrders.filter(Number.isInteger), lastCheckedAt: typeof value.lastCheckedAt === "string" ? value.lastCheckedAt : null } : { completedOrders: [], lastCheckedAt: null };
  } catch { return { completedOrders: [], lastCheckedAt: null }; }
}
export function saveProgress(userId: string, roleId: string, progress: Progress) { if (canUseStorage()) window.localStorage.setItem(progressKey(userId, roleId), JSON.stringify(progress)); }
export function clearProgress(userId: string, roleId: string) { if (canUseStorage()) window.localStorage.removeItem(progressKey(userId, roleId)); }
export function clearUserProgress(userId: string) {
  if (!canUseStorage()) return;
  const prefix = `career-map:v4.5:progress:${userId}:`;
  Object.keys(window.localStorage).filter((key) => key.startsWith(prefix)).forEach((key) => window.localStorage.removeItem(key));
}
