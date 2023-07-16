import { CardStack } from "./card-stack";
import { CardStackType } from "./card-stack-type";
import { GameState } from "./game-state";
import { GameType } from "./game-type";
import * as seedrandom from "seedrandom";
import { Controller } from "./controller";
import { MCall, GameLogic } from "./game-logic";


export class Game {
  gameState?: GameState;
  controllers: { [key: string]: Controller } = {};
  skipMode = true;
  random: seedrandom.PRNG;
  hashes: { [key: string]: null } = {};
  gameLogic?: GameLogic;



  constructor(public gameType: GameType) {
    this.random = this.setSeed('');
    if (gameType.cards === undefined) throw Error(gameType.name + ' not properly initialized');
  }

  setSeed(seed: string): seedrandom.PRNG {
    this.random = seedrandom(seed);
    return this.random;
  }

  createHash(): string {
    while (true) {
      const h = Math.random().toString(36).substring(2);
      if (h in this.hashes) continue;
      this.hashes[h] = null;
      return h;
    }
  }

  private createEmptyCardStack(cardStackType: CardStackType): CardStack {
    return { gameId: this.gameType.id!, type: cardStackType, id: this.createHash(), cards: [] };
  }

  private createEmptyCardStacks(cardStackTypes: { [key: string]: CardStackType }): { [key: string]: CardStack } {
    return Object.entries(cardStackTypes).reduce(
      (a, v) => ({ ...a, [v[0]]: this.createEmptyCardStack(v[1]) }),
      {}
    );
  }

  createGameState(playerIds: string[]): GameState {
    const players = playerIds.reduce(
      (a, v) => ({
        ...a, [v]: { id: v, stacks: this.createEmptyCardStacks(this.gameType.playerStacks) }
      }), {});

    this.gameState = {
      ended: false,
      waiting: false,
      phaseCounter: {},
      // animations: [],
      players: players,
      playerOrder: Object.keys(players).sort(),
      stacks: this.createEmptyCardStacks(this.gameType.globalStacks),
      variables: JSON.parse(JSON.stringify(this.gameType.variables)),
      playersTurn: 0,
      activePhase: this.gameType.startPhase,
    };

    return structuredClone(this.gameState);
  }


  async runFunction(f: string | undefined): Promise<any> {
    if (!this.gameState) throw Error('running undefined game state');
    if (f === undefined) throw Error('running undefined function');
    if (this.gameLogic === undefined) this.gameLogic = new GameLogic(this);
    const funtionNames = Object.getOwnPropertyNames(Object.getPrototypeOf(this.gameLogic)).filter((x) => x != 'constructor')
    const func = ((() => {}).constructor)(...funtionNames, 'return ' + f + '.call()');
    return await func(...funtionNames.map((n) => (<any>this.gameLogic)[n].bind(this.gameLogic)));
  }

  async nextPhase(): Promise<GameState> {
    if (!this.gameState || !this.gameState.activePhase) throw Error('running undefined game phase');
    const phaseKey = this.gameState.activePhase;
    return await this.runFunction(this.gameType.gameActions[this.gameType.gamePhases[phaseKey].action]).then(async () => {
      if (phaseKey in this.gameState!.phaseCounter) this.gameState!.phaseCounter[phaseKey] += 1;
      else this.gameState!.phaseCounter[phaseKey] = 1;
      return structuredClone(this.gameState)!;
    });
  }
}
