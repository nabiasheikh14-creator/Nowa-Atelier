import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SEED_BOOKS } from "../lib/seed-data";

type Doc = {
  title?: string;
  author_name?: string[];
  cover_i?: number;
};

function norm(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function score(doc: Doc, title: string, author: string): number {
  if (!doc.cover_i || !doc.title) return -1;
  const found = norm(doc.title);
  const want = norm(title);
  let points = 0;
  if (found === want) points += 100;
  else if (found.startsWith(`${want} `) || found.startsWith(`${want} (`)) points += 80;
  else return -1;
  const last = norm(author).split(" ").filter((part) => part.length > 2).at(-1) ?? "";
  const names = norm((doc.author_name ?? []).join(" "));
  if (last && names.includes(last)) points += 40;
  else if (author === "Reference" || author === "University publication" || author === "Oxford University Press") points += 10;
  else points -= 25;
  return points;
}

async function search(title: string, author: string): Promise<{ id: number; matched: string; points: number } | null> {
  const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author.split(",")[0] ?? author)}&limit=8&fields=title,author_name,cover_i`;
  const response = await fetch(url, { headers: { "user-agent": "TheLibrary/1.0 (private collection)" } });
  if (!response.ok) return null;
  const data = (await response.json()) as { docs?: Doc[] };
  const ranked = (data.docs ?? [])
    .map((doc) => ({ doc, points: score(doc, title, author) }))
    .filter((item) => item.points >= 70)
    .sort((a, b) => b.points - a.points);
  const best = ranked[0];
  if (!best?.doc.cover_i) return null;
  return { id: best.doc.cover_i, matched: best.doc.title ?? title, points: best.points };
}

async function coverIsReal(id: number): Promise<boolean> {
  const response = await fetch(`https://covers.openlibrary.org/b/id/${id}-L.jpg`, {
    headers: { "user-agent": "TheLibrary/1.0 (private collection)" },
  });
  if (!response.ok) return false;
  const type = response.headers.get("content-type") || "";
  if (!type.startsWith("image/")) return false;
  const bytes = await response.arrayBuffer();
  return bytes.byteLength > 4000;
}

async function main(): Promise<void> {
const seen = new Map<string, { id: number; matched: string; points: number } | null>();
for (const book of SEED_BOOKS) {
  const key = `${book.title}\n${book.author}`;
  if (seen.has(key)) continue;
  const hit = await search(book.title, book.author);
  if (hit && !(await coverIsReal(hit.id))) {
    seen.set(key, null);
    console.log("tiny ", book.title);
  } else {
    seen.set(key, hit);
    console.log(hit ? `${hit.points} ${book.title} -> ${hit.id} (${hit.matched})` : `MISS ${book.title}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 120));
}

const index: Record<string, number> = {};
for (const [key, hit] of seen) {
  if (hit) index[key] = hit.id;
}
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), "../lib/cover-index.json"), JSON.stringify(index, null, 2));
console.log(`saved ${Object.keys(index).length} covers`);
}

void main();
