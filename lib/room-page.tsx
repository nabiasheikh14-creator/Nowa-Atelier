import type { Metadata } from "next";
import { cache } from "react";
import { LibraryExperience } from "@/components/library/LibraryExperience";
import { ClosedRoom } from "@/components/rooms/ClosedRoom";
import { hasDatabase } from "./db";
import { FOUNDER } from "./founder";
import { shelfInfo } from "./genres";
import { findBookBySlug } from "./links";
import { canView, roomBooks, roomByHandle } from "./rooms";
import { currentViewer } from "./session";
import { foundingBooks } from "./store";
import type { Book, Room } from "./types";

export type RoomContext = {
  room: Pick<Room, "handle" | "display_name" | "visibility" | "bio">;
  isOwner: boolean;
  viewerHandle: string | null;
  roomsOpen: boolean;
};

/** One lookup per request, shared by the page and its metadata. Errors surface; they never read as "private". */
const load = cache(async function load(handle: string | null): Promise<{ room: Room | null; books: Book[]; viewer: Awaited<ReturnType<typeof currentViewer>> }> {
  if (!hasDatabase()) {
    // No database: only the founding room exists, read-only, from the seed collection.
    const founder: Room = { id: FOUNDER.id, handle: FOUNDER.handle, display_name: FOUNDER.displayName, bio: FOUNDER.bio, visibility: "public", claimed: false };
    return { room: !handle || handle === FOUNDER.handle ? founder : null, books: await foundingBooks(), viewer: null };
  }
  const viewer = await currentViewer();
  const room = await roomByHandle(handle ?? FOUNDER.handle);
  if (!room || !canView(room, viewer?.id ?? null)) return { room: null, books: [], viewer };
  return { room, books: await roomBooks(room.id), viewer };
});

export async function renderRoom(handle: string | null) {
  const { room, books, viewer } = await load(handle ? handle.toLowerCase() : null);
  if (!room) return <ClosedRoom signedInAs={viewer?.handle ?? null} />;
  const context: RoomContext = {
    room: { handle: room.handle, display_name: room.display_name, visibility: room.visibility, bio: room.bio },
    isOwner: viewer?.id === room.id,
    viewerHandle: viewer?.handle ?? null,
    roomsOpen: hasDatabase(),
  };
  return <LibraryExperience key={room.handle} initialBooks={books} context={context} />;
}

/** Shared links preview as the room, or as the book when ?book= is set. */
export async function roomMetadata(handle: string | null, bookSlug: string | undefined): Promise<Metadata> {
  const { room, books } = await load(handle ? handle.toLowerCase() : null).catch(() => ({ room: null, books: [] as Book[] }));
  if (!room) return { title: "The Library" };
  const owner = room.display_name;
  const book = bookSlug ? findBookBySlug(books, bookSlug) : null;
  if (book) {
    const title = `${book.title} · ${owner}'s library`;
    const description = book.synopsis
      ? `${book.author}. ${book.synopsis.slice(0, 150).replace(/\s+\S*$/, "")}…`
      : `${book.author}, on the ${shelfInfo(book.genre).label} shelf.`;
    return { title, description, openGraph: { title, description }, twitter: { title, description } };
  }
  const title = `${owner}'s library · The Library`;
  const description = room.bio || `${books.length} books, shelved in a reading room.`;
  return { title, description, openGraph: { title, description }, twitter: { title, description } };
}
