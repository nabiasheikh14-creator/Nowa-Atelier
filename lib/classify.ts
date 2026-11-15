import type { Book } from "./types";

/**
 * Puts a book on a shelf from what is known about it: subject headings from
 * Open Library, the owner's own Goodreads shelves, the title, and the year.
 * Ordered so the most specific shelf wins, the way the founding room was sorted:
 * a book of poems is Poetry before it is anything else.
 */
const RULES: { shelf: string; test: RegExp }[] = [
  { shelf: "Poetry", test: /\bpoe(try|ms|t)\b|\bverse\b|haiku|sonnets/ },
  { shelf: "Reference", test: /dictionar|encyclop|thesaur|\breference\b|handbook|textbook|grammar|atlas(es)?\b|study guide/ },
  { shelf: "Memoir", test: /biograph|autobiograph|memoir|diar(y|ies)\b|personal narrative|letters\b|correspondence/ },
  { shelf: "Fantasy", test: /fantasy|magic|wizard|witch|dragon|fair(y|ies)|myth|vampire|werewol|paranormal|supernatural|fae\b|faerie|sorcer/ },
  { shelf: "Speculative", test: /science fiction|sci-fi|scifi|dystopi|utopi|space opera|time travel|post-apocalyp|cyberpunk|robots?\b|aliens?\b/ },
  { shelf: "Mystery", test: /myster|detective|crime|thriller|suspense|murder|spy\b|espionage|noir|whodunit/ },
  { shelf: "Romance", test: /romance|love stor|romantic|chick lit|women's fiction/ },
  { shelf: "Mind", test: /psycholog|self-help|self help|philosoph|feminis|mental health|personal development|mindful|happiness|habits|spiritual|creativity|productivity|motivation/ },
  { shelf: "History", test: /histor(y|ical studies)|politic|government|war\b|wars\b|world war|social science|sociology|economics|current events|journalism|civil rights|colonial/ },
  { shelf: "Science", test: /science\b(?! fiction)|sciences\b|physics|biolog|chemistr|mathemat|astronom|nature\b|natural history|ecolog|evolution|technolog|computers?|medicine|neuroscien/ },
  { shelf: "Art", test: /\bart\b|arts\b|design|architect|photograph|music|film|cinema|painting|drawing|fashion|crafts?\b|cook(ing|books?)/ },
  { shelf: "South Asian", test: /india|pakistan|bangladesh|sri lanka|nepal|afghan|south asia|urdu|hindi|punjab|kashmir|bengal|partition/ },
  { shelf: "East Asian", test: /japan|korea|china|chinese|taiwan|hong kong|tokyo|seoul|manga/ },
];

const FICTION = /fiction|novel|stories|literature|literary/;

export type Shelving = { genre: string; shelves: string[]; subgenres: string[] };

export function classify(input: {
  title: string;
  subjects?: string[];
  userShelves?: string[];
  firstPublished?: number | null;
}): Shelving {
  const subjects = (input.subjects ?? []).map((subject) => subject.trim()).filter(Boolean);
  const userShelves = (input.userShelves ?? [])
    .map((shelf) => shelf.trim().replace(/-/g, " "))
    .filter((shelf) => shelf && !/^(to read|currently reading|read|owned|favorites?|books i own|kindle|ebooks?|library|dnf)$/i.test(shelf));
  const text = [...subjects, ...userShelves, input.title].join(" · ").toLowerCase();

  const matched: string[] = [];
  for (const rule of RULES) if (rule.test.test(text)) matched.push(rule.shelf);

  const isFiction = FICTION.test(text) || matched.some((shelf) => ["Fantasy", "Speculative", "Mystery", "Romance"].includes(shelf));
  const old = typeof input.firstPublished === "number" && input.firstPublished > 0 && input.firstPublished < 1930;
  if (old && (isFiction || matched.length === 0)) matched.unshift("Classics");
  if (matched.length === 0) matched.push(isFiction ? "Literary" : "Other");

  const shelves = [...new Set(matched)].slice(0, 3);
  // Keep a handful of readable subject words as subgenres; Open Library subjects can run to dozens.
  const subgenres = [...new Set([...userShelves.map(titleCase), ...subjects.filter(readable).slice(0, 6)])].slice(0, 8);
  return { genre: shelves[0]!, shelves, subgenres };
}

function readable(subject: string): boolean {
  return (
    subject.length <= 40 &&
    !/[:=]|\d{3,}|^(nyt|new york times|accessible book|protected daisy|in library|lending library|open library|large type)/i.test(subject) &&
    !/^(fiction|fiction, general|novels?|literature|general|english fiction|american fiction|juvenile fiction|ficción|roman)$/i.test(subject)
  );
}

function titleCase(text: string): string {
  return text.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export type ClassifiedBook = Pick<Book, "genre" | "shelves" | "subgenres">;
