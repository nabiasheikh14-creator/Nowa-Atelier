import postgres from "postgres";

/**
 * One Postgres connection pool per server instance. On Vercel the Supabase
 * integration provides POSTGRES_URL (pooled, transaction mode), so prepared
 * statements are off. Without a URL the site runs read-only from the seed data.
 */
export function databaseUrl(): string | null {
  return process.env.POSTGRES_URL || process.env.DATABASE_URL || null;
}

export function hasDatabase(): boolean {
  return databaseUrl() !== null;
}

const globalForDb = globalThis as unknown as { librarySql?: postgres.Sql };

export function sql(): postgres.Sql {
  const url = databaseUrl();
  if (!url) throw new Error("No database is configured.");
  if (!globalForDb.librarySql) {
    const local = /localhost|127\.0\.0\.1/.test(url);
    globalForDb.librarySql = postgres(url, {
      prepare: false,
      // The local test database (PGlite) can't interleave connections; real Postgres can.
      max: local ? 1 : 5,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: local ? false : "require",
    });
  }
  return globalForDb.librarySql;
}
