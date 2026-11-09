# The Library

A private book collection, shown as a dark-academia reading room. The public page is one URL. The keeper's desk is at `/admin`.

Phase 1 is a single owner. There is no public sign-up. Every table still has `owner_id`, so a later version can give each person a room without reshaping the data.

## What was decided

- The keeper signs in with a password. The session is an httpOnly cookie signed on the server. Supabase Auth is not wired up yet.
- The browser never talks to Supabase. Pages and routes use the service role on the server, or a local file when those variables are empty.
- The room is a small study with one wall of shelves, sized to the books that are actually on it. There are no decorative filler volumes.
- A book that appeared in more than one of the owner's lists is shelved once, on the more specific shelf (South Asian writing stays together, and so do the East Asian books, the poems, and the memoirs). The Fellowship of the Ring and Pride and Prejudice are the two titles kept as second copies.
- Five list entries were matched to the published book: Nothing Like the Movies by Lynn Painter, Slow Burn by Julie Garwood, Rumi's Daughter by Muriel Maufroy, In Half by Jasmin B. Frelih, and Are Men Obsolete? by Camille Paglia and Caitlin Moran. The note is in each synopsis.
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

1. The whole collection, in one view. You start facing a single wall. Whole room, under the search bar, returns you there.
2. The genre names under the search bar. Each one slides you to that section: Fantasy, Speculative, Romance, Literary, Classics, South Asian, Poetry, Mystery, Memoir, East Asian, Mind, Reference.
3. Movement. Drag to look. A and D, or the arrow keys, slide along the wall. W and S, or the scroll wheel, step closer and back. You cannot turn away from the shelves.
4. Hover any spine for the title, then click it. The page opens on the front jacket, with a short synopsis. Escape puts the book back. The spine itself is the published spine panel: the edition's color, the title running up the spine, and the author's name. It is not the front cover squeezed into the edge.
5. Search from the top. A match carries you to that volume.
6. Unlock `/admin` to add, edit, or lend a book. A new genre grows its own bay.
