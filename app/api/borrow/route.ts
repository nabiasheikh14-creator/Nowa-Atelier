import { emailOwner } from "@/lib/mail";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { createBorrowRequest, getBook } from "@/lib/store";
import { parseBorrow } from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = rateLimit(clientKey(request, "borrow"), 5, 15 * 60 * 1000);
  if (!limited.ok) {
    return Response.json(
      { error: "Too many notes in a short while. Please wait a little." },
      { status: 429, headers: { "retry-after": String(limited.retryAfter) } },
    );
  }

  const body = (await request.json().catch(() => null)) as { bookId?: unknown } | null;
  const parsed = parseBorrow(body);
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });
  if (parsed.honeypot) return Response.json({ ok: true });

  const bookId = typeof body?.bookId === "string" ? body.bookId : "";
  const target = await getBook(bookId);
  if (!target) return Response.json({ error: "That book is not on the shelves." }, { status: 404 });
  if (target.format !== "physical") {
    return Response.json({ error: "This one is not a copy that leaves the room." }, { status: 400 });
  }
  if (target.status !== "available") {
    return Response.json({ error: "This copy is out at the moment." }, { status: 409 });
  }

  await createBorrowRequest({
    book: target,
    name: parsed.name,
    contact: parsed.contact,
    message: parsed.message,
  });

  await emailOwner(
    `A request for ${target.title}`,
    [
      `${parsed.name} (${parsed.contact}) would like to borrow "${target.title}" by ${target.author}.`,
      "",
      parsed.message || "No message.",
      "",
      "— Sent from The Library",
    ].join("\n"),
  );

  return Response.json({ ok: true });
}
