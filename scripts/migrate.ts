/**
 * Runs on every deploy, before `next build`. Applies the migrations in db/migrations
 * (each is safe to run again) and makes sure the founding room exists with its books.
 * With no database configured it does nothing, so local builds and the read-only
 * preview still work.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { SEED_BOOKS } from "../lib/seed-data";
import { profileOf } from "../lib/genres";
import { FOUNDER } from "../lib/founder";

async function main() {
  const url = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!url) {
    console.log("migrate: no database configured, skipping");
    return;
  }
  const local = /localhost|127\.0\.0\.1/.test(url);
  const sql = postgres(url, { prepare: false, max: 1, ssl: local ? false : "require", onnotice: () => {} });
  try {
    const dir = path.join(process.cwd(), "db", "migrations");
    const files = (await readdir(dir)).filter((name) => name.endsWith(".sql")).sort();
    for (const file of files) {
      const text = await readFile(path.join(dir, file), "utf8");
      await sql.unsafe(text);
      console.log(`migrate: applied ${file}`);
    }

    // The founding room: created once, never overwritten, so edits made in the site survive deploys.
    const [existing] = await sql`select id from profiles where id = ${FOUNDER.id}`;
    if (!existing) {
      await sql.begin(async (tx) => {
        await tx`
          insert into profiles (id, handle, display_name, bio, visibility, claimed)
          values (${FOUNDER.id}, ${FOUNDER.handle}, ${FOUNDER.displayName}, ${FOUNDER.bio}, 'public', false)
          on conflict (id) do nothing`;
        for (const book of SEED_BOOKS) {
          const profile = profileOf(book);
          await tx`
            insert into books (owner_id, title, author, cover_url, synopsis, genre, shelves, subgenres, isbn, source, created_at)
            values (${FOUNDER.id}, ${book.title}, ${book.author}, ${book.cover_url}, ${book.synopsis}, ${book.genre},
                    ${profile.shelves}, ${profile.subgenres}, ${book.isbn}, 'seed', ${book.created_at})`;
        }
      });
      console.log(`migrate: seeded the founding room with ${SEED_BOOKS.length} books`);
    }
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error("migrate: failed", error);
  process.exit(1);
});
