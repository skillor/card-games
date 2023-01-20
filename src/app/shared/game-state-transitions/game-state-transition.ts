import { GAME_STATE_TRANSITION_TYPES } from "./game-state-transition-types";
import { Visitor } from "./visitor";

export abstract class GameStateTransition {
  private type: string;
  public id?: string;
  constructor() {
    this.type = this.constructor.name;
  }

  static accept<T>(v: Visitor<T>, transition: GameStateTransition): T {
    for (let transitionType of GAME_STATE_TRANSITION_TYPES) {
      if (transitionType.name === transition.type) return transitionType.accept(v, transition);
    }
    throw new Error('got undefined transition: ' + transition.type)
  }
}
