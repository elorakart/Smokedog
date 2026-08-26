import { GameClient } from "@/components/game/GameClient";

export default function RoomPage({
  params,
  searchParams,
}: {
  params: { roomId: string };
  searchParams?: { spectate?: string };
}) {
  return (
    <GameClient
      roomId={params.roomId}
      spectate={searchParams?.spectate === "1"}
    />
  );
}
