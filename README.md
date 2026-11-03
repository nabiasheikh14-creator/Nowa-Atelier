# The Library

A private book collection, shown as a dark-academia reading room. The public page is one URL. The keeper's desk is at `/admin`.

Phase 1 is a single owner. There is no public sign-up. Every table still has `owner_id`, so a later version can give each person a room without reshaping the data.

## What was decided

- The keeper signs in with a password. The session is an httpOnly cookie signed on the server. Supabase Auth is not wired up yet.
- The browser never talks to Supabase. Pages and routes use the service role on the server, or a local file when those variables are empty.
- The room has a fixed set of shelf bays. Fantasy, Classics, Design, History, and Self-Help each have a wall. A new genre takes a free wall, or one bay from the fullest wall, and its plaque changes.
- The books in the collection are clickable. The rest of the shelves are decorative volumes drawn with the same instanced mesh.
- Borrow requests can email the keeper through Resend. The visitor never sees that address. If email is not configured, the request is still saved on the desk.
- Room tone is a quiet generated placeholder at `public/audio/ambience.wav`. Replace that file with a real recording when you have one.

## Run it

```bash
npm install
npm run dev
```

Open the site on a desktop-sized window. The development password is `oak-gall` until `OWNER_PASSWORD` is set.

To use Postgres instead of the local `.data/library.json` file, create the tables in `supabase/schema.sql`, load `supabase/seed.sql`, and set the variables in `.env.example`.

## What to look at

1. The room itself: herringbone floor, green walls, walnut cases on three walls, the fireplace, the arched window, the ladder, the chair, the lamp, and the globe.
2. The shelves: varied spines, brass genre plaques, a few leaning books, a few stacks lying flat, and ribbons on the two copies that are already lent.
3. Hover any spine for its title. Click a collection volume (a small gilt diamond on the spine). It slides forward, the view eases in, and the page opens like a book.
4. Search from the top of the screen. A match carries the camera to that volume.
5. On a physical book that is in, request to borrow. On an EPUB, there is no borrow button.
6. Unlock `/admin`, look a book up by ISBN, and approve or decline a request. An approval dims that spine and hangs a ribbon on it.
