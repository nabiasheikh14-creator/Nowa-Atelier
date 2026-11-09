export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^\d{2,10}$/.test(id)) {
    return new Response("Unknown cover.", { status: 400 });
  }

  const upstream = await fetch(`https://covers.openlibrary.org/b/id/${id}-L.jpg`, {
    redirect: "follow",
    headers: { "user-agent": "TheLibrary/1.0 (private collection)" },
  });
  if (!upstream.ok) return new Response("Cover missing.", { status: 404 });
  const type = upstream.headers.get("content-type") || "";
  if (!type.startsWith("image/")) return new Response("Cover missing.", { status: 404 });
  const bytes = await upstream.arrayBuffer();
  if (bytes.byteLength < 4000) return new Response("Cover missing.", { status: 404 });

  return new Response(bytes, {
    headers: {
      "content-type": type,
      "cache-control": "public, max-age=604800",
    },
  });
}
