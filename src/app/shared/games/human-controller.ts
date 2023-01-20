import { combineLatest, Observable, switchMap } from "rxjs";
import { Controller } from "./controller";
import { GameOption } from "./game-option";
import { GameState } from "./game-state";
import { GamesService } from "./games.service";

export class HumanController extends Controller {
  constructor(private gamesService: GamesService) {
    super();
  }

  override choose(gameState: GameState, nextGameStates: GameState[], options: Observable<GameOption[]>, onEmpty: Observable<GameOption>): Observable<GameOption> {
    return combineLatest([options, onEmpty]).pipe(
      switchMap(([options, onEmpty]) => {
        gameState.waiting = true;
        this.gamesService.gameState.next(gameState);
        return this.gamesService.waitForOption([...options, onEmpty]);
      })
    );
  }
}
