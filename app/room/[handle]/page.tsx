import type { Metadata } from "next";
import { renderRoom, roomMetadata } from "@/lib/room-page";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { handle } = await params;
  const { book } = await searchParams;
  return roomMetadata(decodeURIComponent(handle), typeof book === "string" ? book : undefined);
}

export default async function RoomPage({ params }: Props) {
  const { handle } = await params;
  return renderRoom(decodeURIComponent(handle));
}
