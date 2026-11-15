import type { Book } from "./types";
import index from "./genre-index.json";

/**
 * The owner's own reading list sorts the collection into twelve shelves, and
 * names subgenres for every book. A book is shelved once in the room, but it
 * can belong to more than one list. This module keeps both facts.
 */

export type ShelfInfo = { id: string; label: string; name: string; blurb: string };

export const SHELVES: ShelfInfo[] = [
  { id: "Fantasy", label: "Fantasy", name: "Fantasy, mythology & magical fiction", blurb: "High fantasy · Urban fantasy · Mythological fantasy · Magical realism" },
  { id: "Speculative", label: "Sci-fi & Dystopia", name: "Science fiction, dystopian & speculative fiction", blurb: "Dystopian fiction · Political science fiction · Speculative fiction" },
  { id: "Romance", label: "Romance", name: "Contemporary romance & romantic fiction", blurb: "Contemporary romance · Romantic comedy · Young adult romance · Women's fiction" },
  { id: "Mystery", label: "Mystery", name: "Mystery, crime & psychological thrillers", blurb: "Crime fiction · Psychological suspense · Mystery · Thriller" },
  { id: "Literary", label: "Literary", name: "Literary fiction & contemporary world literature", blurb: "Literary fiction · Social realism · Psychological fiction · Family drama" },
  { id: "Classics", label: "Classics", name: "Literary classics & historical literature", blurb: "Classical literature · Victorian literature · Romanticism · Modern classics" },
  { id: "South Asian", label: "South Asian", name: "South Asian literature, history & political writing", blurb: "Postcolonial literature · Pakistani literature · Indian literature · Political commentary" },
  { id: "Poetry", label: "Poetry", name: "Poetry, verse & spiritual literature", blurb: "Contemporary poetry · Modernist poetry · Sufi poetry · Classical poetry" },
  { id: "East Asian", label: "East Asian", name: "Japanese & East Asian contemporary fiction", blurb: "Japanese contemporary fiction · Korean memoir · Quiet literary fiction" },
  { id: "Memoir", label: "Memoir", name: "Memoir, biography & autobiographical writing", blurb: "Memoir · Biography · Diaries · Personal narratives" },
  { id: "Mind", label: "Psychology", name: "Psychology, philosophy, feminism & self-development", blurb: "Popular psychology · Self-help · Feminist theory · Creativity · Social criticism" },
  { id: "Reference", label: "Reference", name: "Reference, academic & miscellaneous", blurb: "Dictionaries · Anthologies · Publications" },
];

const SHELF_BY_ID = new Map(SHELVES.map((shelf) => [shelf.id, shelf]));

export function shelfInfo(id: string): ShelfInfo {
  return SHELF_BY_ID.get(id) ?? { id, label: id, name: id, blurb: "" };
}

/**
 * Subgenres in the list are written freely ("YA fantasy · Heist fantasy").
 * These rules fold them into a small vocabulary that is worth filtering by.
 * Order matters only for display ties.
 */
const TAG_RULES: { tag: string; test: RegExp }[] = [
  { tag: "Young adult", test: /\bya\b|young adult/ },
  { tag: "Children's", test: /children/ },
  { tag: "High & epic fantasy", test: /high fantasy|epic fantasy/ },
  { tag: "Urban & paranormal", test: /urban fantasy|paranormal|vampire/ },
  { tag: "Faerie", test: /faerie/ },
  { tag: "Heist", test: /heist/ },
  { tag: "Mythology", test: /mytholog/ },
  { tag: "Magical realism", test: /magical realism/ },
  { tag: "Allegory", test: /allegor/ },
  { tag: "Philosophical", test: /philosoph/ },
  { tag: "Plays & screenplays", test: /screenplay|stage play|shakespearean/ },
  { tag: "Dystopian", test: /dystopia/ },
  { tag: "Political", test: /politic/ },
  { tag: "Satire & comedy", test: /satire|social comedy|dark comedy/ },
  { tag: "Romantic comedy", test: /romantic comedy|chick lit/ },
  { tag: "Romantic drama", test: /romantic drama|women's fiction|war romance|romantic novella|romantic tragedy/ },
  { tag: "Contemporary romance", test: /contemporary romance/ },
  { tag: "Thriller & suspense", test: /thriller|suspense/ },
  { tag: "Crime & mystery", test: /crime|mystery|murder/ },
  { tag: "Coming-of-age", test: /coming-of-age|bildungsroman/ },
  { tag: "Feminist", test: /feminis/ },
  { tag: "Psychological", test: /psycholog/ },
  { tag: "Existential", test: /existential|absurdist/ },
  { tag: "Modernist", test: /modernis/ },
  { tag: "Historical", test: /historical|holocaust|medieval|partition/ },
  { tag: "Family saga", test: /family saga|family drama|family history/ },
  { tag: "Gothic", test: /gothic/ },
  { tag: "Regency & Victorian", test: /regency|victorian/ },
  { tag: "Postcolonial", test: /postcolonial|partition|feudalism/ },
  // "Social commentary" in the list describes novels too, so it doesn't count as essays here.
  { tag: "Essays & criticism", test: /essays|nonfiction|criticism|international relations/ },
  { tag: "Sufi & spiritual", test: /sufi|spiritual|new thought/ },
  { tag: "Confessional poetry", test: /confessional/ },
  { tag: "Contemporary poetry", test: /contemporary poetry|free verse|love and healing/ },
  { tag: "Memoir & diaries", test: /memoir|diary|autobiograph/ },
  { tag: "Biography", test: /\bbiography/ },
  { tag: "Refugee & diaspora", test: /refugee|diaspora/ },
  { tag: "Mental health", test: /mental health|psychological memoir/ },
  { tag: "Self-help", test: /self-help|personal development|creative/ },
  { tag: "Social realism", test: /social realism|social justice/ },
  { tag: "Anthologies", test: /anthology/ },
  { tag: "Japanese", test: /japanese/ },
  { tag: "Korean", test: /korean/ },
  { tag: "LGBTQ+", test: /lgbtq/ },
];

export const ALL_TAGS = TAG_RULES.map((rule) => rule.tag);

type Entry = { shelves: string[]; subgenres: string[] };
const INDEX = index as Record<string, Entry>;

export type BookProfile = {
  /** Every shelf the owner's list puts this book on. The first is where it stands. */
  shelves: string[];
  /** The owner's own subgenre words, as written. */
  subgenres: string[];
  /** Folded subgenres used by the filters. */
  tags: string[];
};

const cache = new Map<string, BookProfile>();

export function profileOf(book: Pick<Book, "title" | "genre">): BookProfile {
  const key = `${book.title}\n${book.genre}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const entry = INDEX[book.title];
  const shelves = [book.genre, ...(entry?.shelves ?? []).filter((shelf) => shelf !== book.genre)];
  const subgenres = entry?.subgenres ?? [];
  const words = subgenres.join(" · ").toLowerCase();
  const tags = TAG_RULES.filter((rule) => rule.test.test(words)).map((rule) => rule.tag);
  const profile = { shelves, subgenres, tags };
  cache.set(key, profile);
  return profile;
}

export type Filter =
  | { kind: "shelf"; shelf: string; tag: string | null }
  | { kind: "tag"; tag: string }
  | null;

export function matches(book: Book, filter: Filter): boolean {
  if (!filter) return true;
  const profile = profileOf(book);
  if (filter.kind === "tag") return profile.tags.includes(filter.tag);
  if (!profile.shelves.includes(filter.shelf)) return false;
  return filter.tag ? profile.tags.includes(filter.tag) : true;
}

export function filterLabel(filter: Filter): string {
  if (!filter) return "";
  if (filter.kind === "tag") return filter.tag;
  const shelf = shelfInfo(filter.shelf).label;
  return filter.tag ? `${shelf} · ${filter.tag}` : shelf;
}

/** Tags worth offering as chips for a set of books: shared by at least two, and not by all. */
export function tagsFor(books: Book[], minimum = 2): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const book of books) for (const tag of profileOf(book).tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  const order = new Map(TAG_RULES.map((rule, position) => [rule.tag, position]));
  return [...counts]
    .filter(([, count]) => count >= minimum && count < books.length)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || (order.get(a.tag) ?? 0) - (order.get(b.tag) ?? 0));
}

/** Tags that cut across shelves, for the whole-room view. */
export function crossTags(books: Book[]): { tag: string; count: number }[] {
  const shelvesByTag = new Map<string, Set<string>>();
  for (const book of books) {
    for (const tag of profileOf(book).tags) {
      const set = shelvesByTag.get(tag) ?? new Set<string>();
      set.add(book.genre);
      shelvesByTag.set(tag, set);
    }
  }
  return tagsFor(books, 4).filter(({ tag }) => (shelvesByTag.get(tag)?.size ?? 0) >= 2);
}
