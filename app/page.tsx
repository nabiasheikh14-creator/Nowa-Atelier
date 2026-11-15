import type { Metadata } from "next";
import { renderRoom, roomMetadata } from "@/lib/room-page";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { book } = await searchParams;
  return roomMetadata(null, typeof book === "string" ? book : undefined);
}

/** The founding room. */
export default async function HomePage() {
  return renderRoom(null);
}
