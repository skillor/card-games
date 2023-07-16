import { combineLatest, Observable, switchMap, tap } from "rxjs";
import { Controller } from "./controller";
import { GameOption } from "./game-option";
import { GameState } from "./game-state";
import { GameLoaderService } from "./games-loader.service";

export class HumanController extends Controller {
  constructor(private gamesService: GameLoaderService) {
    super();
  }

  override async choose(gameState: GameState, options: GameOption[], onEmpty: GameOption): Promise<GameOption> {
    // TODO
    return onEmpty;
  }
}
