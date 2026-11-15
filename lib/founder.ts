/**
 * The founding room: the collection the site was built around. It is served at "/"
 * and at /@handle. Whoever signs up with OWNER_EMAIL takes it over as their own.
 */
export const FOUNDER = {
  id: process.env.OWNER_ID || "00000000-0000-4000-8000-000000000001",
  handle: process.env.FOUNDER_HANDLE || "nabia",
  displayName: process.env.FOUNDER_NAME || "Nabia",
  bio: "A private collection, shown as a reading room.",
};

export function ownerEmail(): string | null {
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  return email ? email : null;
}
