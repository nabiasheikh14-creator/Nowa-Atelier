import { isOwner } from "@/lib/auth";
import { listBorrowRequests } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isOwner())) return Response.json({ error: "The desk is locked." }, { status: 401 });
  const requests = await listBorrowRequests();
  return Response.json({ requests });
}
