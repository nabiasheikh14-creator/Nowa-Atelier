import { LibraryExperience } from "@/components/library/LibraryExperience";
import { listBooks } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const books = await listBooks();
  return <LibraryExperience initialBooks={books} />;
}
