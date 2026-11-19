import { requireViewer } from "@/lib/api";
import { ownerRequests } from "@/lib/requests";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Everyone who has asked to borrow one of your books, waiting ones first. */
export async function GET(request: Request) {
  const viewer = await requireViewer(request);
  if (viewer instanceof Response) return viewer;
  const requests = await ownerRequests(viewer.id);
  return Response.json({ requests });
}
