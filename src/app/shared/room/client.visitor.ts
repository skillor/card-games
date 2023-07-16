import { DataConnection } from "peerjs";
import { GameLoaderService } from "../games/games-loader.service";
import { GameOptionsPacket } from "../packets/game-options.packet";
import { PingPacket } from "../packets/ping.packet";
import { RoomStatePacket } from "../packets/room-state.packet";
import { Visitor } from "../packets/visitor";
import { RoomService } from "./room.service";

export class ClientVisitor extends Visitor<void> {
  constructor(private roomService: RoomService, private gamesService: GameLoaderService, private clientConn: DataConnection) {
    super()
  }

  override visitPing(e: PingPacket): void {
    this.clientConn.send(e);
  }

  override visitRoomState(e: RoomStatePacket): void {
    this.roomService.roomState.next(e.roomState);
  }

  override visitGameOptions(e: GameOptionsPacket): void {
    // this.gamesService.waitForOption(e.gameOptions).subscribe((choice) => {
    //   const packet = new GameOptionsPacket([choice]);
    //   packet.id = e.id;
    //   this.clientConn.send(packet);
    // });
  }
}
