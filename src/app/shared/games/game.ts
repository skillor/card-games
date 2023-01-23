import { catchError, combineLatest, concat, concatAll, concatMap, connectable, delay, finalize, first, generate, interval, last, map, mergeMap, mergeScan, observable, Observable, of, publish, skip, skipWhile, Subject, switchMap, switchScan, takeUntil, takeWhile, tap, throttle, timer } from "rxjs";
import { Animation } from "../animation/animation";
import { Card } from "./card";
import { CardStack } from "./card-stack";
import { CardStackType } from "./card-stack-type";
import { GameState } from "./game-state";
import { GameType } from "./game-type";
import { Player } from "./player";
import * as seedrandom from "seedrandom";
import { GameOption } from "./game-option";
import { Controller } from "./controller";
import { GameLogic } from "./game-logic";


export class Game {
  gameState?: GameState;
  controllers: {[key: string]: Controller} = {};
  skipMode = true;
  nextGameStates: GameState[] = [];
  random: seedrandom.PRNG;
  hashes: {[key: string]: null} = {};


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
    return {gameId: this.gameType.id!, type: cardStackType, id: this.createHash(), cards: []};
  }

  private createEmptyCardStacks(cardStackTypes: {[key: string]: CardStackType}): {[key: string]: CardStack}  {
    return Object.entries(cardStackTypes).reduce(
      (a, v) => ({...a, [v[0]]: this.createEmptyCardStack(v[1])}),
      {}
    );
  }

  createGameState(playerIds: string[]): GameState {
    const players = playerIds.reduce(
      (a, v) => ({ ...a, [v]: {id: v, stacks: this.createEmptyCardStacks(this.gameType.playerStacks)}
      }), {});

    this.gameState = {
      ended: false,
      waiting: false,
      actionCounter: {},
      phaseCounter: {},
      animations: [],
      players: players,
      playerOrder: Object.keys(players).sort(),
      stacks: this.createEmptyCardStacks(this.gameType.globalStacks),
      variables: JSON.parse(JSON.stringify(this.gameType.variables)),
      playersTurn: 0,
      activePhase: this.gameType.startPhase,
    };

    return JSON.parse(JSON.stringify(this.gameState));
  }

  runFunction(f: string | undefined): Observable<any> {
    if (!this.gameState) throw Error('running undefined game state');
    if (f === undefined) throw Error('running undefined function');
    const func = Function("game", "of", "rv", 'rv[0]=' + f);
    const rv: (Observable<any> | undefined)[] = [undefined];
    func(new GameLogic(this), of, rv);
    if (rv[0] === undefined) return of(false);
    return rv[0];
  }

  nextPhase(): Observable<GameState> {
    if (!this.gameState || !this.gameState.activePhase) throw Error('running undefined game phase');
    const phaseKey = this.gameState.activePhase;
    return this.runFunction(this.gameType.gameActions[this.gameType.gamePhases[phaseKey].action!].action!).pipe(
      first(),
      catchError((err) => {console.log(JSON.parse(JSON.stringify(this.gameState))); throw err;}),
      map(() => {
        if (phaseKey in this.gameState!.phaseCounter) this.gameState!.phaseCounter[phaseKey] += 1;
        else this.gameState!.phaseCounter[phaseKey] = 1;
        const gs = JSON.parse(JSON.stringify(this.gameState));
        this.nextGameStates.push(gs);
        return gs;
      }),
    );
  }

  nextPhases(): Observable<GameState> {
    this.nextGameStates = [];
    return new Observable((observer) => {
      let int: any = undefined;
      let abort = false;
      observer.add(() => {
        clearInterval(int);
        abort = true;
        observer.complete();
      });
      const check = () => {
        while (!abort && !this.gameState!.waiting) {
          observer.next();
        }
      };
      check();
      int = setInterval(() => {
        check();
      }, 0);
    }).pipe(
      concatMap(() => {
        return this.nextPhase();
      }),
      takeWhile((v) => !v.ended, true),
    );
  }

  nextStates(): Observable<GameState> {
    return this.nextPhases().pipe(
      switchMap((v) => {
        return new Observable<GameState>((observer) => {
          while (true) {
            const gs = this.nextGameStates.shift();
            if (!gs) break;
            observer.next(gs);
          }
          observer.complete();
        });
      }),
    );
  }
}
