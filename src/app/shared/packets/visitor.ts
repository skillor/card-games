import { GameOptionsPacket } from "./game-options.packet";
import { JoinRoomPacket } from "./join-room.packet";
import { PingPacket } from "./ping.packet";
import { RoomStatePacket } from "./room-state.packet";

export abstract class Visitor<T> {
  visitPing(e: PingPacket): T {
    throw new Error('got unexpected packet: ' + String(e));
  }
  visitJoinRoom(e: JoinRoomPacket): T {
    throw new Error('got unexpected packet: ' + String(e));
  }
  visitRoomState(e: RoomStatePacket): T {
    throw new Error('got unexpected packet: ' + String(e));
  }
  visitGameOptions(e: GameOptionsPacket): T {
    throw new Error('got unexpected packet: ' + String(e));
  }
}
