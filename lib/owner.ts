/** Stable id for the single keeper of this library. Multi-user rooms can replace this later. */
export const OWNER_ID =
  process.env.OWNER_ID || "00000000-0000-4000-8000-000000000001";

export function ownerPassword(): string {
  const fromEnv = process.env.OWNER_PASSWORD;
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") return "";
  return "oak-gall";
}

export function sessionSecret(): string {
  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") return "";
  return "dev-only-library-secret";
}
