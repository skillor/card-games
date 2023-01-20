import { Observable, combineLatest, map } from "rxjs";
import * as seedrandom from "seedrandom";
import { Controller } from "./controller";
import { GameOption } from "./game-option";
import { GameState } from "./game-state";

export class RandomController extends Controller {
  random: seedrandom.PRNG;

  constructor(seed='seed') {
    super();
    this.random = seedrandom(seed);
  }

  override choose(gameState: GameState, nextGameStates: GameState[], options: Observable<GameOption[]>, onEmpty: Observable<GameOption>): Observable<GameOption> {
    return combineLatest([options, onEmpty]).pipe(
      map(([options, onEmpty]) => {
        if (options.length === 0) {
          return onEmpty;
        }
        return options[Math.floor(this.random() * options.length)];
      })
    );
  }
}
