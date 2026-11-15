import type { Metadata } from "next";
import Link from "next/link";
import { hasDatabase } from "@/lib/db";
import { FOUNDER } from "@/lib/founder";
import { publicRooms } from "@/lib/rooms";
import { currentViewer } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Rooms · The Library", description: "Look around other people's libraries." };

export default async function RoomsPage() {
  const rooms = hasDatabase() ? await publicRooms().catch(() => []) : [];
  const viewer = hasDatabase() ? await currentViewer().catch(() => null) : null;
  return (
    <main className="rooms-page">
      <header>
        <p className="kicker">The Library</p>
        <h1>Rooms</h1>
        <p className="lede">Other people&apos;s shelves, and what they&apos;re reading now.</p>
        <div className="paper-actions">
          <Link className="sv-room" href="/">
            Back to the library
          </Link>
          {hasDatabase() && (
            <Link className="sv-room" href={viewer?.handle ? `/@${viewer.handle}` : "/join"}>
              {viewer?.handle ? "Your room" : "Make your own room"}
            </Link>
          )}
        </div>
      </header>
      {rooms.length === 0 ? (
        <p className="lede">No public rooms yet. {hasDatabase() ? "Yours could be the first." : ""}</p>
      ) : (
        <ul className="room-list">
          {rooms.map((room) => (
            <li key={room.id}>
              <Link href={room.id === FOUNDER.id ? "/" : `/@${room.handle}`}>
                <strong>{room.display_name}&apos;s library</strong>
                <span className="room-meta">
                  @{room.handle} · {room.book_count} {room.book_count === 1 ? "book" : "books"}
                </span>
                {room.bio && <span className="room-bio">{room.bio}</span>}
                {room.reading.length > 0 && (
                  <span className="room-reading">
                    <i>Reading now</i> {room.reading.join(" · ")}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
