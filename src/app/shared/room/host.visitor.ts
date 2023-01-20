import { DataConnection } from "peerjs";
import { first } from "rxjs";
import { JoinRoomPacket } from "../packets/join-room.packet";
import { PingPacket } from "../packets/ping.packet";
import { RoomStatePacket } from "../packets/room-state.packet";
import { Visitor } from "../packets/visitor";
import { RoomService } from "./room.service";

export class HostVisitor extends Visitor<void> {
  constructor(private roomService: RoomService, private clientConn: DataConnection) {
    super();
  }

  override visitPing(e: PingPacket): void {
    this.roomService.roomState.pipe(
      first()
    ).subscribe((roomState) => {
      if (roomState === undefined) return;
      if (!(this.clientConn.connectionId in roomState.users)) return;
      roomState.users[this.clientConn.connectionId].ping = Date.now() - e.start;
      this.roomService.roomState.next(roomState);
      this.roomService.broadcast(new RoomStatePacket(roomState));
    });
  }

  override visitJoinRoom(e: JoinRoomPacket): void {
    this.roomService.roomState.pipe(
      first()
    ).subscribe((roomState) => {
      if (roomState === undefined) return;
      for (let user of Object.values(roomState.users)) {
        if (user.name === e.me.name) {
          console.log('deny join of username: ' + e.me.name);
          this.roomService.disconnectUser(this.clientConn.connectionId);
          return;
        }
      }
      roomState.users[this.clientConn.connectionId] = e.me;
      this.roomService.roomState.next(roomState);
      this.roomService.pingConnection(this.clientConn);
    });
  }
}
