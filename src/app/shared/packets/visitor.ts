import { JoinRoom } from "./join-room.packet";
import { Ping } from "./ping.packet";
import { RoomState } from "./room-state.packet";

export abstract class Visitor<T> {
  visitPing(e: Ping): T {
    throw new Error('got unexpected packet: ' + String(e));
  }
  visitJoinRoom(e: JoinRoom): T {
    throw new Error('got unexpected packet: ' + String(e));
  }
  visitRoomState(e: RoomState): T {
    throw new Error('got unexpected packet: ' + String(e));
  };
}
