// Resolve the selected user/role from the Your Path URL, defaulting to the
// canonical demo pair. Pure + standalone so both the browser and SSR
// (search === null) paths are directly testable without faking `window`.

export const DEFAULT_USER_ID = "user_2340";
export const DEFAULT_ROLE_ID = "data_scientist";

export function resolveSelection(search: string | null): { userId: string; roleId: string } {
  const params = new URLSearchParams(search ?? "");
  return {
    userId: params.get("user") || DEFAULT_USER_ID,
    roleId: params.get("role") || DEFAULT_ROLE_ID,
  };
}
