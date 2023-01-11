import { CardStack } from "./card-stack";
import { CardStackType } from "./card-stack-type";
import { GameState } from "./game-state";
import { GameType } from "./game-type";

export class Game {
  constructor(private gameType: GameType) {
    if (gameType.cards === undefined) throw Error(gameType.name + ' not properly initialized');
  }

  private createEmptyCardStack(cardStackType: CardStackType): CardStack {
    return {type: cardStackType, cards: []};
  }

  private createEmptyCardStacks(cardStackTypes: {[key: string]: CardStackType}): {[key: string]: CardStack}  {
    return Object.entries(cardStackTypes).reduce(
      (a, v) => ({...a, [v[0]]: this.createEmptyCardStack(v[1])}),
      {}
    );
  }

  createGameState(playerIds: string[]): GameState {
    return {
      players: playerIds.reduce(
        (a, v) => ({ ...a, [v]: {stacks: this.createEmptyCardStacks(this.gameType.playerStacks)}
        }), {}),
      stacks: this.createEmptyCardStacks(this.gameType.globalStacks),
      variables: JSON.parse(JSON.stringify(this.gameType.variables)),
    };
  }

  draw(from: CardStack, to: CardStack, n: number): void {
    for (let i=0; i < n; i++) {
      let card = from.cards.pop();
      if (card === undefined) break;
      to.cards.push(card);
    }
  }

  populate(stack: CardStack, n: number): void {
    for (let cardType of Object.values(this.gameType.cards!)) {
      for (let i=0; i < n; i++) {
        stack.cards.push({cardType: cardType});
      }
    }
  }

  shuffle(stack: CardStack): void {
    for (let i = stack.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [stack.cards[i], stack.cards[j]] = [stack.cards[j], stack.cards[i]];
    }
  }

  runFunction(gameState: GameState, f: string): GameState {
    const newGameState: GameState = JSON.parse(JSON.stringify(gameState));
    const func = Function("game", "players", "stacks", "variables", f);
    func(this, Object.values(newGameState.players), newGameState.stacks, newGameState.variables);
    return newGameState;
  }

  startGame(gameState: GameState): GameState {
    return this.runFunction(gameState, this.gameType.gameStart);
  }
}
