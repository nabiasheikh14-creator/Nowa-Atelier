import type { Metadata } from "next";
import { RoomsHall, type HallViewer } from "@/components/rooms/RoomsHall";
import { hasDatabase } from "@/lib/db";
import { FOUNDER } from "@/lib/founder";
import { publicRooms, roomById } from "@/lib/rooms";
import { currentViewer } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Rooms · The Library", description: "Look along other people's shelves, and step into any room." };

export default async function RoomsPage() {
  const open = hasDatabase();
  const rooms = open ? await publicRooms() : [];
  const viewer = open ? await currentViewer() : null;
  const own = viewer ? await roomById(viewer.id) : null;
  const hallViewer: HallViewer = own ? { handle: own.handle, visibility: own.visibility } : null;
  return (
    <RoomsHall
      rooms={rooms.map((room) => ({ ...room, href: room.id === FOUNDER.id ? "/" : `/@${room.handle}` }))}
      viewer={hallViewer}
      roomsOpen={open}
    />
  );
}
