import { combineLatest, Observable, of, switchMap, tap } from "rxjs";
import { GameOptionsPacket } from "../packets/game-options.packet";
import { Packet } from "../packets/packet";
import { Visitor } from "../packets/visitor";
import { RoomService } from "../room/room.service";
import { Controller } from "./controller";
import { GameOption } from "./game-option";
import { GameState } from "./game-state";
import { GameLoaderService } from "./games-loader.service";

export class RemoteController extends Controller {
  constructor(private gamesService: GameLoaderService, private roomService: RoomService, private connId: string) {
    super();
  }

  override async choose(gameState: GameState, options: GameOption[], onEmpty: GameOption): Promise<GameOption> {
    // TODO
    return onEmpty;
  }
}
