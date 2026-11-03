import { isOwner } from "@/lib/auth";
import { decideBorrowRequest } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isOwner())) return Response.json({ error: "The desk is locked." }, { status: 401 });
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { status?: unknown } | null;
  if (body?.status !== "approved" && body?.status !== "declined") {
    return Response.json({ error: "Choose approve or decline." }, { status: 400 });
  }
  const updated = await decideBorrowRequest(id, body.status);
  if (!updated) return Response.json({ error: "That request is not on the desk." }, { status: 404 });
  return Response.json({ request: updated });
}
