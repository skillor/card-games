import { combineLatest, Observable, of, switchMap, tap } from "rxjs";
import { GameOptionsPacket } from "../packets/game-options.packet";
import { Packet } from "../packets/packet";
import { Visitor } from "../packets/visitor";
import { RoomService } from "../room/room.service";
import { Controller } from "./controller";
import { GameOption } from "./game-option";
import { GameState } from "./game-state";
import { GamesService } from "./games.service";

export class RemoteController extends Controller {
  constructor(private gamesService: GamesService, private roomService: RoomService, private connId: string) {
    super();
  }

  override choose(gameState: GameState, nextGameStates: GameState[], options: Observable<GameOption[]>, onEmpty: Observable<GameOption>): Observable<GameOption> {
    return combineLatest([options, onEmpty]).pipe(
      switchMap(([options, onEmpty]) => {
        gameState.waiting = true;
        this.gamesService.gameState.next(JSON.parse(JSON.stringify(gameState)));
        const sendOptions = (options.length == 0 ? [onEmpty] : options);
        return this.roomService.sendWaitResponseTo(this.connId, new GameOptionsPacket(sendOptions)).pipe(
          switchMap((packet) => {
            gameState.waiting = false;
            return of(Packet.accept(new class extends Visitor<GameOption> {
              override visitGameOptions(e: GameOptionsPacket): GameOption {
                for (let option of sendOptions) {
                  if (option.id === e.gameOptions[0].id) {
                    return option;
                  }
                }
                return sendOptions[0];
              }
            }(), packet));
          }),
        );
      })
    );
  }
}
