"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { readGoodreadsExport, type GoodreadsRow } from "@/lib/goodreads";
import { shelfInfo } from "@/lib/genres";
import type { RoomContext } from "@/lib/room-page";
import type { SearchHit } from "@/lib/open-library";
import type { Book, BookStatus, BorrowRequestView, ReadingStatus, RequestStatus } from "@/lib/types";

export type DialogName = "add" | "import" | "settings" | "requests" | null;

/** Small fetch wrapper: JSON in, JSON out, a readable error on failure. */
export async function call<T>(url: string, method = "GET", body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error("Couldn't reach The Library. Check your connection and try again.");
  }
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "Something went wrong. Try again in a moment.");
  return data;
}

// ——— the menu in the corner ———

export function RoomMenu({
  context,
  reading,
  onOpenBook,
  onDialog,
}: {
  context: RoomContext;
  reading: Book[];
  onOpenBook: (id: string) => void;
  onDialog: (name: DialogName) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !wrap.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", close);
    };
  }, [open]);

  const name = context.room.display_name;
  const pick = (dialog: DialogName) => {
    setOpen(false);
    onDialog(dialog);
  };

  return (
    <div className="room-menu" ref={wrap}>
      {reading.length > 0 && (
        <p className="reading-now">
          <span>Reading now</span>
          {reading.slice(0, 2).map((book, index) => (
            <button key={book.id} type="button" onClick={() => onOpenBook(book.id)}>
              {index > 0 && <i aria-hidden="true">·</i>}
              {book.title}
            </button>
          ))}
        </p>
      )}
      <button type="button" className="room-name" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((value) => !value)}>
        {context.isOwner ? "Your room" : `${name}'s library`}
        {context.isOwner && context.pendingRequests > 0 && (
          <b className="request-dot" aria-label={`${context.pendingRequests} borrow ${context.pendingRequests === 1 ? "request" : "requests"} waiting`}>
            {context.pendingRequests}
          </b>
        )}
        <i aria-hidden="true">▾</i>
      </button>
      {open && (
        <div className="room-popover" role="menu">
          {context.isOwner ? (
            <>
              <button type="button" role="menuitem" className="menu-requests" onClick={() => pick("requests")}>
                Borrow requests
                {context.pendingRequests > 0 && <b>{context.pendingRequests} waiting</b>}
              </button>
              <hr />
              <button type="button" role="menuitem" onClick={() => pick("add")}>
                Add a book
              </button>
              <button type="button" role="menuitem" onClick={() => pick("import")}>
                Import from Goodreads
              </button>
              <button type="button" role="menuitem" onClick={() => pick("settings")}>
                Room settings
              </button>
              <hr />
              <Link role="menuitem" href="/rooms">
                Visit other rooms
              </Link>
            </>
          ) : (
            <>
              {context.room.bio && <p className="room-bio">{context.room.bio}</p>}
              <Link role="menuitem" href="/rooms">
                Visit other rooms
              </Link>
              {context.roomsOpen && (
                <Link role="menuitem" href={context.viewerHandle ? `/@${context.viewerHandle}` : "/join"}>
                  {context.viewerHandle ? "Go to your room" : "Make your own room"}
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ——— dialogs ———

function Dialog({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="tool-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`tool-sheet ${wide ? "wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby="tool-title">
        <header>
          <h2 id="tool-title">{title}</h2>
          <button ref={closeRef} type="button" className="book-close" onClick={onClose}>
            Close
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

const ADD_AS: { value: ReadingStatus; label: string }[] = [
  { value: "owned", label: "On my shelves" },
  { value: "reading", label: "Reading now" },
  { value: "read", label: "Read" },
];

function AddBook({ onClose, onAdded }: { onClose: () => void; onAdded: (book: Book) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [state, setState] = useState<"idle" | "searching" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [addAs, setAddAs] = useState<ReadingStatus>("owned");
  const [added, setAdded] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const timer = window.setTimeout(async () => {
      setState("searching");
      try {
        const data = await call<{ results: SearchHit[] }>(`/api/search?q=${encodeURIComponent(q)}`);
        setResults(data.results);
        setState("idle");
      } catch (problem) {
        setError((problem as Error).message);
        setState("error");
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  async function add(key: string, payload: { hit?: SearchHit; title?: string; author?: string }) {
    setBusy(key);
    setError(null);
    try {
      const { book } = await call<{ book: Book }>("/api/my/books", "POST", { ...payload, reading_status: addAs });
      setAdded((current) => ({ ...current, [key]: shelfInfo(book.genre).label }));
      onAdded(book);
    } catch (problem) {
      setError((problem as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const shown = query.trim().length >= 2 ? results : [];

  return (
    <Dialog title="Add a book" onClose={onClose} wide>
      <div className="add-as" role="radiogroup" aria-label="Add as">
        {ADD_AS.map((option) => (
          <button key={option.value} type="button" role="radio" aria-checked={addAs === option.value} className={addAs === option.value ? "on" : ""} onClick={() => setAddAs(option.value)}>
            {option.label}
          </button>
        ))}
      </div>
      <label className="tool-field">
        <span>Title, author, or ISBN</span>
        <input ref={inputRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. The God of Small Things" />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <ul className="hits" aria-live="polite" aria-busy={state === "searching"}>
        {state === "searching" && shown.length === 0 && <li className="hint-row">Looking through the catalogue…</li>}
        {state === "idle" && query.trim().length >= 2 && shown.length === 0 && (
          <li className="hint-row">No matches. Try fewer words, or add it by hand below.</li>
        )}
        {shown.map((hit) => {
          const key = `${hit.workKey ?? hit.title}|${hit.isbn ?? ""}`;
          return (
            <li key={key}>
              <span className="thumb" aria-hidden="true">
                {hit.coverId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/cover?id=${hit.coverId}`} alt="" loading="lazy" />
                ) : null}
              </span>
              <span className="hit-text">
                <strong>{hit.title}</strong>
                <em>
                  {hit.author}
                  {hit.year ? ` · ${hit.year}` : ""}
                </em>
              </span>
              {added[key] ? (
                <span className="added">On {added[key]}</span>
              ) : (
                <button type="button" className="ink-button small" disabled={busy !== null} onClick={() => void add(key, { hit })}>
                  {busy === key ? "Adding…" : "Add"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {manual ? (
        <form
          className="manual"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const title = String(data.get("title") || "").trim();
            if (!title) return setError("Add the book's title.");
            void add(`manual|${title}`, { title, author: String(data.get("author") || "").trim() });
            event.currentTarget.reset();
          }}
        >
          <label className="tool-field">
            <span>Title</span>
            <input name="title" required maxLength={300} />
          </label>
          <label className="tool-field">
            <span>Author</span>
            <input name="author" maxLength={200} />
          </label>
          <button className="ink-button" type="submit" disabled={busy !== null}>
            Add to my shelves
          </button>
        </form>
      ) : (
        <button type="button" className="text-button" onClick={() => setManual(true)}>
          Can&apos;t find it? Add it by hand
        </button>
      )}
    </Dialog>
  );
}

type ImportStep =
  | { step: "choose"; error: string | null }
  | { step: "review"; rows: GoodreadsRow[]; includeWishlist: boolean }
  | { step: "adding"; total: number; sent: number }
  | { step: "shelving"; added: number; skipped: number; remaining: number; total: number }
  | { step: "done"; added: number; skipped: number };

function ImportBooks({ onClose, onFinished }: { onClose: () => void; onFinished: () => void }) {
  const [state, setState] = useState<ImportStep>({ step: "choose", error: null });
  // Stops the import loop if the dialog closes. Reset on mount, so a remount doesn't read as closed.
  const cancelled = useRef(false);
  useEffect(() => {
    cancelled.current = false;
    return () => {
      cancelled.current = true;
    };
  }, []);

  async function readFile(file: File) {
    if (file.size > 15_000_000) return setState({ step: "choose", error: "That file is larger than any Goodreads export we'd expect. Choose goodreads_library_export.csv." });
    const rows = readGoodreadsExport(await file.text());
    if (!rows) return setState({ step: "choose", error: "That doesn't look like a Goodreads export. Choose goodreads_library_export.csv." });
    if (rows.length === 0) return setState({ step: "choose", error: "That export has no books in it." });
    setState({ step: "review", rows, includeWishlist: true });
  }

  async function run(rows: GoodreadsRow[]) {
    let added = 0;
    let skipped = 0;
    try {
      for (let start = 0; start < rows.length; start += 200) {
        if (cancelled.current) return;
        setState({ step: "adding", total: rows.length, sent: start });
        const result = await call<{ added: number; skipped: number }>("/api/my/import", "POST", { rows: rows.slice(start, start + 200) });
        added += result.added;
        skipped += result.skipped;
      }
      let remaining = added;
      while (remaining > 0 && !cancelled.current) {
        setState({ step: "shelving", added, skipped, remaining, total: added });
        const result = await call<{ remaining: number }>("/api/my/enrich", "POST", {});
        if (result.remaining >= remaining && result.remaining > 0) await new Promise((resolve) => setTimeout(resolve, 1500));
        remaining = result.remaining;
      }
      setState({ step: "done", added, skipped });
    } catch (problem) {
      setState({ step: "choose", error: `${(problem as Error).message} Books already added are safe; importing again skips them.` });
    }
  }

  const counts = state.step === "review"
    ? {
        read: state.rows.filter((row) => row.status === "read").length,
        reading: state.rows.filter((row) => row.status === "reading").length,
        wishlist: state.rows.filter((row) => row.status === "to-read").length,
        other: state.rows.filter((row) => row.status === "owned").length,
      }
    : null;

  return (
    <Dialog title="Import from Goodreads" onClose={state.step === "done" ? onFinished : onClose}>
      {state.step === "choose" && (
        <div className="import-step">
          <ol className="steps">
            <li>
              On a computer, open{" "}
              <a href="https://www.goodreads.com/review/import" target="_blank" rel="noreferrer">
                Goodreads → My Books → Import and export
              </a>
              .
            </li>
            <li>Choose <strong>Export Library</strong>, wait for the link, and download the file.</li>
            <li>Choose that file here. It stays on your computer; only the book details are sent.</li>
          </ol>
          <label className="file-pick">
            <input type="file" accept=".csv,text/csv" onChange={(event) => event.target.files?.[0] && void readFile(event.target.files[0])} />
            <span className="ink-button">Choose goodreads_library_export.csv</span>
          </label>
          {state.error && (
            <p className="form-error" role="alert">
              {state.error}
            </p>
          )}
        </div>
      )}
      {state.step === "review" && counts && (
        <div className="import-step">
          <p className="big-number">{state.rows.length} books</p>
          <p className="muted">
            {counts.read} read · {counts.reading} reading now · {counts.wishlist} want to read
            {counts.other ? ` · ${counts.other} on other shelves` : ""}
          </p>
          <label className="check">
            <input
              type="checkbox"
              checked={state.includeWishlist}
              onChange={(event) => setState({ ...state, includeWishlist: event.target.checked })}
            />
            Include “want to read” books. They&apos;re kept with your room but don&apos;t stand on the shelves.
          </label>
          <p className="muted">Your ratings, reviews, and Goodreads shelves come with them. Books already in your room are skipped.</p>
          <div className="paper-actions">
            <button type="button" className="ink-button" onClick={() => void run(state.includeWishlist ? state.rows : state.rows.filter((row) => row.status !== "to-read"))}>
              Import {state.includeWishlist ? state.rows.length : state.rows.length - counts.wishlist} books
            </button>
            <button type="button" className="text-button" onClick={() => setState({ step: "choose", error: null })}>
              Choose a different file
            </button>
          </div>
        </div>
      )}
      {state.step === "adding" && (
        <div className="import-step" aria-live="polite">
          <p className="big-number">Adding your books…</p>
          <Progress value={state.sent} max={state.total} />
        </div>
      )}
      {state.step === "shelving" && (
        <div className="import-step" aria-live="polite">
          <p className="big-number">Finding covers and shelving</p>
          <Progress value={state.total - state.remaining} max={state.total} />
          <p className="muted">
            {state.total - state.remaining} of {state.total}. You can close this; it picks up where it left off next time you import.
          </p>
        </div>
      )}
      {state.step === "done" && (
        <div className="import-step">
          <p className="big-number">{state.added} books are in your room.</p>
          {state.skipped > 0 && <p className="muted">{state.skipped} were already there, so they were skipped.</p>}
          <p className="muted">If a book landed on the wrong shelf, open it and move it.</p>
          <div className="paper-actions">
            <button type="button" className="ink-button" onClick={onFinished}>
              See my room
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

function Progress({ value, max }: { value: number; max: number }) {
  const percent = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <i style={{ width: `${percent}%` }} />
    </div>
  );
}

const VISIBILITY: { value: RoomContext["room"]["visibility"]; label: string; note: string }[] = [
  { value: "private", label: "Private", note: "Only you can see your room." },
  { value: "unlisted", label: "Anyone with the link", note: "Not listed, but you can share the link." },
  { value: "public", label: "Public", note: "Listed in Rooms for anyone to visit." },
];

function RoomSettings({ context, onClose }: { context: RoomContext; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [visibility, setVisibility] = useState(context.room.visibility);
  const link = typeof window !== "undefined" ? `${window.location.origin}/@${context.room.handle}` : "";

  async function save(form: HTMLFormElement) {
    const data = new FormData(form);
    setSaving(true);
    setError(null);
    try {
      const { room } = await call<{ room: { handle: string } }>("/api/me", "PATCH", {
        displayName: data.get("displayName"),
        handle: data.get("handle"),
        bio: data.get("bio"),
        visibility,
      });
      // A full load: the handle in the address may have changed.
      window.location.replace(`${window.location.origin}/@${room.handle}`);
    } catch (problem) {
      setError((problem as Error).message);
      setSaving(false);
    }
  }

  async function signOut() {
    await call("/api/account/signout", "POST", {}).catch(() => null);
    window.location.replace(window.location.origin);
  }

  return (
    <Dialog title="Room settings" onClose={onClose}>
      <form
        className="settings"
        onSubmit={(event) => {
          event.preventDefault();
          void save(event.currentTarget);
        }}
      >
        <label className="tool-field">
          <span>Name on your room</span>
          <input name="displayName" defaultValue={context.room.display_name} maxLength={60} required />
        </label>
        <label className="tool-field">
          <span>Handle</span>
          <span className="handle-input">
            <i>/@</i>
            <input name="handle" defaultValue={context.room.handle} maxLength={30} pattern="[a-z0-9-]{2,30}" required />
          </span>
        </label>
        <label className="tool-field">
          <span>
            A line about your room <small>optional</small>
          </span>
          <input name="bio" defaultValue={context.room.bio ?? ""} maxLength={280} placeholder="What you read, and why" />
        </label>
        <fieldset className="visibility">
          <legend>Who can see your room</legend>
          {VISIBILITY.map((option) => (
            <label key={option.value} className={visibility === option.value ? "on" : ""}>
              <input type="radio" name="visibility" value={option.value} checked={visibility === option.value} onChange={() => setVisibility(option.value)} />
              <strong>{option.label}</strong>
              <em>{option.note}</em>
            </label>
          ))}
        </fieldset>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="paper-actions">
          <button className="ink-button" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            className="text-button"
            onClick={() =>
              void navigator.clipboard
                .writeText(link)
                .then(() => {
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                })
                .catch(() => null)
            }
          >
            {copied ? "Link copied" : "Copy link to your room"}
          </button>
          <button type="button" className="text-button push" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </form>
    </Dialog>
  );
}

export function RoomDialogs({
  dialog,
  context,
  onClose,
  onAdded,
  onReload,
  onPending,
  onBookStatus,
}: {
  dialog: DialogName;
  context: RoomContext;
  onClose: () => void;
  onAdded: (book: Book) => void;
  onReload: () => void;
  onPending: (count: number) => void;
  onBookStatus: (bookId: string, status: BookStatus) => void;
}) {
  if (!context.isOwner || !dialog) return null;
  if (dialog === "requests") return <BorrowRequests onClose={onClose} onPending={onPending} onBookStatus={onBookStatus} />;
  if (dialog === "add") return <AddBook onClose={onClose} onAdded={onAdded} />;
  if (dialog === "import")
    return (
      <ImportBooks
        onClose={onClose}
        onFinished={() => {
          onClose();
          onReload();
        }}
      />
    );
  return <RoomSettings context={context} onClose={onClose} />;
}

// ——— borrow requests ———

const ANSWERED: Record<Exclude<RequestStatus, "pending">, string> = {
  approved: "Lent",
  declined: "Declined",
  returned: "Back on the shelf",
};

function since(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/** An email or a phone number becomes a link; anything else stays as written. */
function ContactLink({ contact }: { contact: string }) {
  const value = contact.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return <a href={`mailto:${value}`}>{value}</a>;
  if (/^\+?[\d\s()-]{7,}$/.test(value)) return <a href={`tel:${value.replace(/[^\d+]/g, "")}`}>{value}</a>;
  return <span>{value}</span>;
}

function BorrowRequests({
  onClose,
  onPending,
  onBookStatus,
}: {
  onClose: () => void;
  onPending: (count: number) => void;
  onBookStatus: (bookId: string, status: BookStatus) => void;
}) {
  const [requests, setRequests] = useState<BorrowRequestView[] | null>(null);
  const [tab, setTab] = useState<"waiting" | "answered">("waiting");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    call<{ requests: BorrowRequestView[] }>("/api/my/requests")
      .then((data) => {
        if (!live) return;
        setRequests(data.requests);
        onPending(data.requests.filter((request) => request.status === "pending").length);
      })
      .catch((problem) => live && setError((problem as Error).message));
    return () => {
      live = false;
    };
  }, [onPending]);

  async function answer(request: BorrowRequestView, status: RequestStatus) {
    setBusy(request.id);
    setError(null);
    try {
      const { request: updated } = await call<{ request: BorrowRequestView }>(`/api/my/requests/${request.id}`, "PATCH", { status });
      const next = (requests ?? []).map((item) => (item.id === updated.id ? updated : item));
      setRequests(next);
      onPending(next.filter((item) => item.status === "pending").length);
      if (status === "approved") onBookStatus(request.book_id, "lent");
      else if (request.status === "approved") onBookStatus(request.book_id, "available");
    } catch (problem) {
      setError((problem as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const waiting = (requests ?? []).filter((request) => request.status === "pending");
  const answered = (requests ?? []).filter((request) => request.status !== "pending");
  const shown = tab === "waiting" ? waiting : answered;

  return (
    <Dialog title="Borrow requests" onClose={onClose} wide>
      <p className="muted small request-note">
        Bayaz doesn&apos;t message anyone for you. Reach out using the contact they left, then mark what you decided here.
      </p>
      <div className="segmented" role="tablist" aria-label="Requests">
        <button type="button" role="tab" aria-selected={tab === "waiting"} className={tab === "waiting" ? "on" : ""} onClick={() => setTab("waiting")}>
          Waiting{waiting.length > 0 ? ` · ${waiting.length}` : ""}
        </button>
        <button type="button" role="tab" aria-selected={tab === "answered"} className={tab === "answered" ? "on" : ""} onClick={() => setTab("answered")}>
          Answered{answered.length > 0 ? ` · ${answered.length}` : ""}
        </button>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {requests === null && !error && <p className="muted">Checking your requests…</p>}
      {requests !== null && shown.length === 0 && (
        <div className="request-empty">
          {tab === "waiting" ? (
            <>
              <p>No one is waiting on you.</p>
              <p className="muted small">When someone asks to borrow a book from your room, it shows up here.</p>
            </>
          ) : (
            <p className="muted small">Requests you&apos;ve answered will be kept here.</p>
          )}
        </div>
      )}
      {shown.length > 0 && (
        <ul className="borrow-list">
          {shown.map((request) => (
            <li key={request.id} className={`request-card is-${request.status}`}>
              <div className="request-head">
                <div>
                  <strong>{request.book_title}</strong>
                  <em>{request.book_author}</em>
                </div>
                <time dateTime={request.created_at}>{since(request.created_at)}</time>
              </div>
              <p className="request-who">
                <b>{request.requester_name}</b> asked to borrow it · <ContactLink contact={request.requester_contact} />
              </p>
              {request.message && <blockquote>{request.message}</blockquote>}
              <div className="request-actions">
                {request.status === "pending" && (
                  <>
                    <button type="button" className="ink-button small" disabled={busy === request.id} onClick={() => void answer(request, "approved")}>
                      Lend it
                    </button>
                    <button type="button" className="ink-button small ghost" disabled={busy === request.id} onClick={() => void answer(request, "declined")}>
                      Say no
                    </button>
                  </>
                )}
                {request.status !== "pending" && <span className="request-status">{request.status === "approved" ? `Lent to ${request.requester_name}` : ANSWERED[request.status]}</span>}
                {request.status === "approved" && (
                  <button type="button" className="ink-button small ghost" disabled={busy === request.id} onClick={() => void answer(request, "returned")}>
                    It&apos;s back
                  </button>
                )}
                {request.status !== "pending" && (
                  <button type="button" className="text-button" disabled={busy === request.id} onClick={() => void answer(request, "pending")}>
                    Undo
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}

/** A room with nothing on its shelves yet. */
export function EmptyRoom({ context, onDialog }: { context: RoomContext; onDialog: (name: DialogName) => void }) {
  return (
    <main className="paper-page">
      <section className="paper-card">
        <p className="kicker">{context.isOwner ? "Your room" : `${context.room.display_name}'s library`}</p>
        <h1>{context.isOwner ? "Your shelves are ready." : "These shelves are still empty."}</h1>
        {context.isOwner ? (
          <>
            <p>Add a book you love, or bring your whole library over from Goodreads. Each book finds its own shelf.</p>
            <div className="paper-actions">
              <button type="button" className="ink-button" onClick={() => onDialog("import")}>
                Import from Goodreads
              </button>
              <button type="button" className="ink-button ghost" onClick={() => onDialog("add")}>
                Add a book
              </button>
              <button type="button" className="text-button" onClick={() => onDialog("settings")}>
                Room settings
              </button>
            </div>
            <p className="muted small">
              Your room is {context.room.visibility === "private" ? "private, so only you can see it" : context.room.visibility === "unlisted" ? "visible to anyone with the link" : "public"}. Change that in Room settings.
            </p>
          </>
        ) : (
          <>
            <p>{context.room.display_name} hasn&apos;t shelved any books yet.</p>
            <div className="paper-actions">
              <Link className="ink-button" href="/rooms">
                Visit other rooms
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
