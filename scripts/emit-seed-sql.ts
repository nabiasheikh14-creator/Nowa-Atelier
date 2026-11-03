import { writeFileSync } from "node:fs";
import { SEED_BOOKS } from "../lib/seed-data";

function sql(value: string | null): string {
  if (value === null) return "null";
  return `'${value.replaceAll("'", "''")}'`;
}

const values = SEED_BOOKS.map(
  (book) =>
    `  (${sql(book.id)}, ${sql(book.owner_id)}, ${sql(book.title)}, ${sql(book.author)}, ${sql(book.cover_url)}, ${sql(book.synopsis)}, ${sql(book.genre)}, ${sql(book.format)}, ${book.rating ?? "null"}, ${sql(book.review)}, ${sql(book.isbn)}, ${sql(book.status)}, ${sql(book.created_at)})`,
).join(",\n");

const file = `-- Generated from lib/seed-data.ts. Re-run with: npx tsx scripts/emit-seed-sql.ts
insert into books (
  id, owner_id, title, author, cover_url, synopsis, genre, format, rating, review, isbn, status, created_at
) values
${values}
on conflict (id) do nothing;
`;

writeFileSync(new URL("../supabase/seed.sql", import.meta.url), file);
console.log(`wrote ${SEED_BOOKS.length} books`);
