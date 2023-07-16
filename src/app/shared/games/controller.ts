import { GameOption } from "./game-option";
import { GameState } from "./game-state";

export class Controller {
  async choose(gameState: GameState, options: GameOption[], onEmpty: GameOption): Promise<GameOption> {
    const _options = await options;
    if (_options.length == 0) return onEmpty;
    return _options[0];
  }
}
