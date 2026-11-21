import { hasDatabase, sql } from "@/lib/db";
import { FOUNDER, ownerEmail } from "@/lib/founder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Setup checks for the site's owner. Says whether things are configured, never what they are. */
export async function GET() {
  const database = hasDatabase();
  let foundingRoomClaimed: boolean | null = null;
  if (database) {
    const [row] = await sql()<{ claimed: boolean }[]>`select claimed from profiles where id = ${FOUNDER.id}`;
    foundingRoomClaimed = row?.claimed ?? null;
  }
  return Response.json({ database, ownerEmailConfigured: ownerEmail() !== null, foundingRoomClaimed });
}
