"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Book, BorrowRequestView } from "@/lib/types";

type Draft = {
  id?: string;
  isbn: string;
  title: string;
  author: string;
  cover_url: string;
  synopsis: string;
  genre: string;
  format: "physical" | "epub";
  rating: string;
  review: string;
  status: "available" | "lent";
};

const emptyDraft = (): Draft => ({
  isbn: "",
  title: "",
  author: "",
  cover_url: "",
  synopsis: "",
  genre: "",
  format: "physical",
  rating: "",
  review: "",
  status: "available",
});

export function AdminDesk() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [requests, setRequests] = useState<BorrowRequestView[]>([]);
  const [tab, setTab] = useState<"collection" | "requests">("requests");
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function load() {
    const [bookResponse, requestResponse] = await Promise.all([
      fetch("/api/books", { cache: "no-store" }),
      fetch("/api/admin/requests", { cache: "no-store" }),
    ]);
    if (requestResponse.status === 401) {
      setAuthed(false);
      return;
    }
    const bookPayload = (await bookResponse.json()) as { books: Book[] };
    const requestPayload = (await requestResponse.json()) as { requests: BorrowRequestView[] };
    setBooks(bookPayload.books);
    setRequests(requestPayload.requests);
    setAuthed(true);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const genres = useMemo(() => {
    const set = new Set(["Fantasy", "Classics", "Design", "Self-Help", "History"]);
    books.forEach((book) => set.add(book.genre));
    return [...set];
  }, [books]);

  const visibleBooks = books.filter((book) => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return true;
    return `${book.title} ${book.author} ${book.genre}`.toLowerCase().includes(needle);
  });

  async function login(event: FormEvent) {
    event.preventDefault();
    setLoginError(null);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setLoginError(payload?.error || "The key was refused.");
      return;
    }
    setPassword("");
    await load();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
  }

  function edit(book: Book) {
    setTab("collection");
    setDraft({
      id: book.id,
      isbn: book.isbn || "",
      title: book.title,
      author: book.author,
      cover_url: book.cover_url || "",
      synopsis: book.synopsis || "",
      genre: book.genre,
      format: book.format,
      rating: book.rating === null ? "" : String(book.rating),
      review: book.review || "",
      status: book.status,
    });
    setMessage(null);
    setError(null);
  }

  async function lookup() {
    setError(null);
    setMessage(null);
    setBusy(true);
    const response = await fetch(`/api/books/lookup?isbn=${encodeURIComponent(draft.isbn)}`);
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      book?: { title: string; author: string; cover_url: string | null; synopsis: string | null; isbn: string };
    } | null;
    setBusy(false);
    if (!response.ok || !payload?.book) {
      setError(payload?.error || "No record found.");
      return;
    }
    setDraft((current) => ({
      ...current,
      isbn: payload.book?.isbn || current.isbn,
      title: payload.book?.title || current.title,
      author: payload.book?.author || current.author,
      cover_url: payload.book?.cover_url || current.cover_url,
      synopsis: payload.book?.synopsis || current.synopsis,
    }));
    setMessage("Filled from Open Library. Change anything before it goes on the shelf.");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    const payload = {
      ...draft,
      rating: draft.rating === "" ? null : Number(draft.rating),
    };
    const response = await fetch(draft.id ? `/api/books/${draft.id}` : "/api/books", {
      method: draft.id ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    setBusy(false);
    if (!response.ok) {
      setError(body?.error || "The shelf did not take the book.");
      return;
    }
    setDraft(emptyDraft());
    setMessage(draft.id ? "The entry is updated." : "It has a place on the shelf.");
    await load();
  }

  async function remove(id: string) {
    setError(null);
    const response = await fetch(`/api/books/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("It could not be removed.");
      return;
    }
    if (draft.id === id) setDraft(emptyDraft());
    setConfirmDelete(null);
    await load();
  }

  async function decide(id: string, status: "approved" | "declined") {
    const response = await fetch(`/api/admin/requests/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      setError("The request could not be updated.");
      return;
    }
    await load();
  }

  async function markReturned(id: string) {
    await fetch(`/api/books/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "available" }),
    });
    await load();
  }

  if (authed === null) {
    return (
      <main className="desk">
        <p className="kicker">The desk</p>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="desk">
        <form className="lock" onSubmit={login}>
          <p className="kicker">Keeper</p>
          <h1>The desk is locked.</h1>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>
          {loginError && <p className="form-error">{loginError}</p>}
          <button className="ink-button" type="submit">
            Unlock
          </button>
          <Link href="/">Return to the room</Link>
        </form>
      </main>
    );
  }

  return (
    <main className="desk wide">
      <header className="desk-bar">
        <div>
          <p className="kicker">Keeper</p>
          <h1>The desk</h1>
        </div>
        <div className="desk-links">
          <Link href="/">The room</Link>
          <button type="button" onClick={() => void logout()}>
            Lock
          </button>
        </div>
      </header>
      <div className="tabs">
        <button type="button" className={tab === "requests" ? "on" : ""} onClick={() => setTab("requests")}>
          Requests ({requests.filter((item) => item.status === "pending").length})
        </button>
        <button type="button" className={tab === "collection" ? "on" : ""} onClick={() => setTab("collection")}>
          Collection ({books.length})
        </button>
      </div>
      {tab === "requests" ? (
        <section className="panel">
          {requests.length === 0 && <p className="aside">No one has asked yet.</p>}
          <ul className="request-list">
            {requests.map((request) => (
              <li key={request.id}>
                <div>
                  <strong>{request.book_title}</strong>
                  <span>{request.book_author}</span>
                  <p>
                    {request.requester_name} · {request.requester_contact}
                  </p>
                  {request.message && <p className="note">{request.message}</p>}
                  <time dateTime={request.created_at}>{formatWhen(request.created_at)}</time>
                </div>
                {request.status === "pending" ? (
                  <div className="row-actions">
                    <button type="button" onClick={() => void decide(request.id, "approved")}>
                      Approve
                    </button>
                    <button type="button" onClick={() => void decide(request.id, "declined")}>
                      Decline
                    </button>
                  </div>
                ) : (
                  <em className={`chip ${request.status}`}>{request.status}</em>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="collection">
          <form className="paper" onSubmit={save}>
            <h2>{draft.id ? "Edit a volume" : "Add a volume"}</h2>
            <div className="isbn-row">
              <label>
                ISBN
                <input value={draft.isbn} onChange={(event) => setDraft({ ...draft, isbn: event.target.value })} />
              </label>
              <button type="button" onClick={() => void lookup()} disabled={busy || !draft.isbn.trim()}>
                Look up
              </button>
            </div>
            <label>
              Title
              <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required />
            </label>
            <label>
              Author
              <input value={draft.author} onChange={(event) => setDraft({ ...draft, author: event.target.value })} required />
            </label>
            <label>
              Genre
              <input
                list="genres"
                value={draft.genre}
                onChange={(event) => setDraft({ ...draft, genre: event.target.value })}
                required
              />
              <datalist id="genres">
                {genres.map((genre) => (
                  <option key={genre} value={genre} />
                ))}
              </datalist>
            </label>
            <label>
              Format
              <select
                value={draft.format}
                onChange={(event) => setDraft({ ...draft, format: event.target.value as Draft["format"] })}
              >
                <option value="physical">Physical</option>
                <option value="epub">EPUB</option>
              </select>
            </label>
            <label>
              Cover URL
              <input value={draft.cover_url} onChange={(event) => setDraft({ ...draft, cover_url: event.target.value })} />
            </label>
            <label>
              Synopsis
              <textarea rows={4} value={draft.synopsis} onChange={(event) => setDraft({ ...draft, synopsis: event.target.value })} />
            </label>
            <label>
              My rating
              <input
                type="number"
                min={0}
                max={5}
                step={0.5}
                value={draft.rating}
                onChange={(event) => setDraft({ ...draft, rating: event.target.value })}
              />
            </label>
            <label>
              My review
              <textarea rows={4} value={draft.review} onChange={(event) => setDraft({ ...draft, review: event.target.value })} />
            </label>
            <label>
              Status
              <select
                value={draft.status}
                onChange={(event) => setDraft({ ...draft, status: event.target.value as Draft["status"] })}
              >
                <option value="available">Available</option>
                <option value="lent">Lent out</option>
              </select>
            </label>
            {error && <p className="form-error">{error}</p>}
            {message && <p className="form-ok">{message}</p>}
            <div className="form-actions">
              <button className="ink-button" type="submit" disabled={busy}>
                {draft.id ? "Save changes" : "Put it on the shelf"}
              </button>
              {draft.id && (
                <button className="text-button" type="button" onClick={() => setDraft(emptyDraft())}>
                  New entry
                </button>
              )}
            </div>
          </form>
          <div className="panel">
            <input
              className="filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Filter the collection"
            />
            <ul className="book-admin">
              {visibleBooks.map((book) => (
                <li key={book.id}>
                  <div>
                    <strong>{book.title}</strong>
                    <span>
                      {book.author} · {book.genre} · {book.format}
                      {book.status === "lent" ? " · lent" : ""}
                    </span>
                  </div>
                  <div className="row-actions">
                    {book.status === "lent" && (
                      <button type="button" onClick={() => void markReturned(book.id)}>
                        Mark returned
                      </button>
                    )}
                    <button type="button" onClick={() => edit(book)}>
                      Edit
                    </button>
                    {confirmDelete === book.id ? (
                      <button type="button" onClick={() => void remove(book.id)}>
                        Confirm delete
                      </button>
                    ) : (
                      <button type="button" onClick={() => setConfirmDelete(book.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}

function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Karachi",
  }).format(new Date(iso));
}
