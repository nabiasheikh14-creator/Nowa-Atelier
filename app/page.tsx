import type { Metadata } from "next";
import { LibraryExperience } from "@/components/library/LibraryExperience";
import { listBooks } from "@/lib/store";
import { findBookBySlug } from "@/lib/links";
import { shelfInfo } from "@/lib/genres";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

/** A shared book link previews as that book, not as the whole library. */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { book: slug } = await searchParams;
  if (typeof slug !== "string") return {};
  const book = findBookBySlug(await listBooks(), slug);
  if (!book) return {};
  const title = `${book.title} · The Library`;
  const description = book.synopsis
    ? `${book.author}. ${book.synopsis.slice(0, 150).replace(/\s+\S*$/, "")}…`
    : `${book.author}, on the ${shelfInfo(book.genre).label} shelf.`;
  return { title, description, openGraph: { title, description }, twitter: { title, description } };
}

export default async function HomePage() {
  const books = await listBooks();
  return <LibraryExperience initialBooks={books} />;
}
