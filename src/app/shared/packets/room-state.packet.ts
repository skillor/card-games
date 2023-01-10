import { RoomState as RoomStateI } from "../room/room.state";
import { Packet } from "./packet";
import { PACKET_TYPES } from "./packet-types";
import { Visitor } from "./visitor";

export class RoomState extends Packet {
  constructor(public roomState: RoomStateI) {
    super();
  }

  static override accept<T>(v: Visitor<T>, packet: Packet): T {
    return v.visitRoomState(<RoomState>packet);
  };
}
PACKET_TYPES.push(RoomState);
