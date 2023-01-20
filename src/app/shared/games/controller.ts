import { combineLatest, map, Observable } from "rxjs";
import { GameOption } from "./game-option";
import { GameState } from "./game-state";

export class Controller {
  choose(gameState: GameState, nextGameStates: GameState[], options: Observable<GameOption[]>, onEmpty: Observable<GameOption>): Observable<GameOption> {
    return combineLatest([options, onEmpty]).pipe(
      map(([options, onEmpty]) => {
        if (options.length === 0) {
          return onEmpty;
        }
        return options[0];
      })
    );
  }
}
