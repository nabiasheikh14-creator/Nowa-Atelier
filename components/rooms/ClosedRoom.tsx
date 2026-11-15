import Link from "next/link";

/** A room that doesn't exist, or is private to someone else. The two look the same on purpose. */
export function ClosedRoom({ signedInAs }: { signedInAs: string | null }) {
  return (
    <main className="paper-page">
      <section className="paper-card">
        <p className="kicker">The Library</p>
        <h1>This room is closed.</h1>
        <p>It may be private, or the link may be wrong. Check the address with whoever sent it.</p>
        <div className="paper-actions">
          <Link className="ink-button" href="/rooms">
            Visit public rooms
          </Link>
          <Link className="text-link" href={signedInAs ? `/@${signedInAs}` : "/join"}>
            {signedInAs ? "Go to your room" : "Make your own room"}
          </Link>
        </div>
      </section>
    </main>
  );
}
