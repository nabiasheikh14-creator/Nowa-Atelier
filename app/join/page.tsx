import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { JoinForm } from "@/components/rooms/JoinForm";
import { hasDatabase } from "@/lib/db";
import { currentViewer } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Make your room · The Library" };

export default async function JoinPage() {
  const viewer = hasDatabase() ? await currentViewer().catch(() => null) : null;
  if (viewer?.handle) redirect(`/@${viewer.handle}`);
  return (
    <main className="paper-page">
      <section className="paper-card join">
        <p className="kicker">The Library</p>
        <h1>A room for your books.</h1>
        <p>Shelve what you own, say what you thought of it, and let people look around. Bring your Goodreads library over in a minute.</p>
        {hasDatabase() ? <JoinForm /> : <p className="form-error">Rooms aren&apos;t open on this site yet.</p>}
      </section>
    </main>
  );
}
