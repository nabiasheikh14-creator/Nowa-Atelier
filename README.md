# The Library

A reading room for your books. Each person gets a room at `/@handle`: a wall of shelves in 3D, sorted by genre, with their ratings, reviews, and what they're reading now. The founding room, Nabia's, is served at `/`.

## What people can do

- **Make a room** at `/join` with an email and password. Rooms start private.
- **Add books** by searching Open Library (title, author, or ISBN). Each book shelves itself from its subjects; owners can move it.
- **Import from Goodreads**: upload `goodreads_library_export.csv`. Ratings, reviews, shelves, and "currently reading" come along; covers and better shelving follow from Open Library, with progress.
- **Rate, review, and track reading** inside the open book: on the shelf, reading, read, want to read.
- **Choose who sees the room**: private, anyone with the link, or public (listed at `/rooms`).
- **Visit other rooms** at `/rooms`. Every book, shelf, and subgenre has its own link.
- **Day and night**, a list view, and a phone layout with swipeable shelves.

## How it's built

- Next.js (App Router), React Three Fiber for the room.
- Postgres via the Supabase integration on Vercel, reached with `POSTGRES_URL` from the server only. Row level security is on with no public policies.
- Accounts are the site's own: scrypt password hashes, database-backed sessions in an httpOnly cookie, same-origin checks on every change, and per-visitor rate limits.
- `db/migrations/*.sql` run on every deploy (`npm run build` runs `scripts/migrate.ts` first). They are safe to run again. The founding room is seeded once and never overwritten.
- Without a database the site still runs: the founding room is served read-only from `lib/seed-data.ts` and sign-up is hidden.

## Settings (Vercel → Project → Settings → Environment Variables)

| Variable | What it does |
| --- | --- |
| `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING` | Added by the Supabase integration. |
| `OWNER_EMAIL` | Whoever signs up with this email takes over the founding room. Borrow requests for it are emailed here. |
| `RESEND_API_KEY`, `RESEND_FROM` | Optional. Sends borrow requests to room owners by email. |
| `FOUNDER_HANDLE`, `FOUNDER_NAME` | Optional. The founding room's handle and name (default `nabia`, `Nabia`). |

## Run it locally

```bash
npm install
npm run dev            # read-only founding room, no database
```

With a database:

```bash
npx pglite-server --db=.data/pg --port=5433 -m 1 &
export POSTGRES_URL=postgres://postgres:postgres@127.0.0.1:5433/postgres
npm run migrate
npm run dev
```

Room tone is a placeholder at `public/audio/ambience.wav`; replace it with a real recording.
