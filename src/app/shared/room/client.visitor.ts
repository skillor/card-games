import { DataConnection } from "peerjs";
import { Ping } from "../packets/ping.packet";
import { RoomState } from "../packets/room-state.packet";
import { Visitor } from "../packets/visitor";
import { RoomService } from "./room.service";

export class ClientVisitor extends Visitor<void> {
  constructor(private roomService: RoomService, private clientConn: DataConnection) {
    super()
  }

  override visitPing(e: Ping): void {
    this.clientConn.send(e);
  }

  override visitRoomState(e: RoomState): void {
    this.roomService.roomState.next(e.roomState);
  }

}
