/** Stable id for the single keeper of this library. Multi-user rooms can replace this later. */
export const OWNER_ID =
  process.env.OWNER_ID || "00000000-0000-4000-8000-000000000001";

export function ownerPassword(): string {
  return "";
}

export function sessionSecret(): string {
  return "";
}
