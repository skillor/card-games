import { RoomState } from "../room/room-state";
import { Packet } from "./packet";
import { PACKET_TYPES } from "./packet-types";
import { Visitor } from "./visitor";

export class RoomStatePacket extends Packet {
  constructor(public roomState: RoomState) {
    super();
  }

  static override accept<T>(v: Visitor<T>, packet: Packet): T {
    return v.visitRoomState(<RoomStatePacket>packet);
  };
}
PACKET_TYPES.push(RoomStatePacket);
