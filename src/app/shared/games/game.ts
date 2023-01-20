import { catchError, combineLatest, concatAll, concatMap, connectable, delay, finalize, first, generate, interval, last, map, mergeMap, mergeScan, observable, Observable, of, publish, skip, skipWhile, Subject, switchMap, switchScan, takeUntil, takeWhile, tap, throttle, timer } from "rxjs";
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


export class Game {
  gameState?: GameState;
  controllers: {[key: string]: Controller} = {};
  skipMode = true;
  nextGameStates: GameState[] = [];
  random: seedrandom.PRNG;
  hashes: {[key: string]: null} = {};


  constructor(private gameType: GameType) {
    this.random = this.setSeed('');
    if (gameType.cards === undefined) throw Error(gameType.name + ' not properly initialized');
  }

  setSeed(seed: string): seedrandom.PRNG {
    this.random = seedrandom(seed);
    return this.random;
  }

  private createHash(): string {
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
      playerOrder: this.shuffleArray(Object.keys(players)),
      stacks: this.createEmptyCardStacks(this.gameType.globalStacks),
      variables: JSON.parse(JSON.stringify(this.gameType.variables)),
      playersTurn: 0,
      activePhase: this.gameType.startPhase,
    };

    return JSON.parse(JSON.stringify(this.gameState));
  }

  shuffleArray<T>(a: T[]): T[] {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  getStack(id: Observable<string>, player: Observable<Player> | undefined): Observable<CardStack> {
    if (player !== undefined) return combineLatest([id, player]).pipe(switchMap(([id, player]) => of(player.stacks[id])));
    return id.pipe(switchMap((id) => of(this.gameState!.stacks[id])));
  }

  getVariable(id: Observable<string>): Observable<any> {
    return id.pipe(switchMap((id) => of(this.gameState!.variables[id].value)));
  }

  setVariable(id: Observable<string>, value: Observable<any>): Observable<boolean> {
    return combineLatest([id, value]).pipe(
      switchMap(([id, value]) => {
        this.gameState!.variables[id].value = value;
        return of(true);
      })
    );
  }

  forEachPlayer(f: (player: Observable<Player>) => Observable<any>): Observable<any[]> {
    return combineLatest(
      Object.values(this.gameState!.players).sort(
        (a, b) => this.gameState!.playerOrder.indexOf(a.id) - this.gameState!.playerOrder.indexOf(b.id)
      ).map((player => f(of(player))))
    );
  }

  randomPlayer(): Observable<Player> {
    const keys = Object.keys(this.gameState!.players);
    return of(this.gameState!.players[keys[keys.length * this.random() << 0]]);
  }

  currentPlayer(): Observable<Player> {
    const playerId = this.gameState!.playerOrder[this.gameState!.playersTurn];
    return of(this.gameState!.players[playerId]);
  }

  nextPlayer(): Observable<Player> {
    return of(this.gameState!.players[this.gameState!.playerOrder[(this.gameState!.playersTurn + 1) % this.gameState!.playerOrder.length]]);
  }

  setPhase(player: Observable<Player>, phase: Observable<string>): Observable<boolean> {
    return combineLatest([phase, player]).pipe(switchMap(([phase, player]) => {
      this.gameState!.playersTurn = this.gameState!.playerOrder.indexOf(player.id);
      this.gameState!.activePhase = phase;
      return of(true);
    }));
  }

  cards(stack: Observable<CardStack>): Observable<Card[]> {
    return stack.pipe(switchMap((stack) => {
      return of(stack.cards);
    }));
  }

  topCards(stack: Observable<CardStack>, n: Observable<number> = of(1)): Observable<Card[]> {
    return combineLatest([n, stack]).pipe(switchMap(([n, stack]) => {
      return of(stack.cards.slice(-n));
    }));
  }

  bottomCards(stack: Observable<CardStack>, n: Observable<number> = of(1)): Observable<Card[]> {
    return combineLatest([n, stack]).pipe(switchMap(([n, stack]) => of(stack.cards.slice(0, n))));
  }

  empty(a: Observable<any[]>): Observable<boolean> {
    return a.pipe(switchMap((a) => of(a.length === 0)));
  }

  end(end: Observable<boolean>): Observable<boolean> {
    return end.pipe(switchMap((end) => {
      this.gameState!.ended = end;
      return of(end);
    }));
  }

  runAction(actionKey: Observable<string>): Observable<any> {
    return actionKey.pipe(switchMap((actionKey) => {
      if (actionKey in this.gameState!.actionCounter) this.gameState!.actionCounter[actionKey] += 1;
      else this.gameState!.actionCounter[actionKey] = 1;
      const action = this.gameType.gameActions[actionKey];
      if (!action || !action.action) return of(false);
      return this.runFunction(action.action);
    }));
  }

  moveCards(from: Observable<CardStack>, to: Observable<CardStack>, cards: Observable<Card[]>): Observable<boolean> {
    return combineLatest([from, to, cards]).pipe(switchMap(([from, to, cards]) => {
      for (let wCard of cards) {
        let cardI = from.cards.findIndex((card) => card.id === wCard.id);
        if (cardI === -1) continue;
        let gs: GameState;
        if (!this.skipMode) {
          gs = JSON.parse(JSON.stringify(this.gameState));
        }
        let card = from.cards.splice(cardI, 1)[0];
        to.cards.push(card);
        if (!this.skipMode) {
          gs!.animations.push({fromId: card.id, toId: to.id, targetId: card.id, type: 'fly', duration: 100, next: 50});
          this.nextGameStates.push(gs!);
        }
      }
      return of(true);
    }));
  }

  populate(stack: Observable<CardStack>, n: Observable<number>): Observable<boolean> {
    return combineLatest([n, stack]).pipe(switchMap(([n, stack]) => {
      const animations: Animation[] = [];
      stack.cards = [];
      for (let cardType of Object.values(this.gameType.cards!)) {
        for (let i=0; i < n; i++) {
          const card = {cardType: cardType, id: this.createHash()};
          stack.cards.push(card);
          if (!this.skipMode) animations.push({fromId: null, toId: card.id, targetId: card.id, type: 'fly', duration: 100, next: 10});
        }
      }
      if (!this.skipMode) {
        const gs: GameState = JSON.parse(JSON.stringify(this.gameState));
        gs.animations = animations;
        this.nextGameStates.push(gs);
      }
      return of(true);
    }));
  }

  shuffle(stack: Observable<CardStack>): Observable<boolean> {
    return stack.pipe(switchMap((stack) => {
      const animations: Animation[] = [];
      for (let i = stack.cards.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [stack.cards[i], stack.cards[j]] = [stack.cards[j], stack.cards[i]];
        if (!this.skipMode) {
          animations.push({fromId: stack.cards[j].id, toId: null, targetId: stack.cards[j].id, type: 'shuffle', duration: 100, next: 1});
          animations.push({fromId: stack.cards[j].id, toId: null, targetId: stack.cards[i].id, type: 'shuffle', duration: 100, next: 1});
        }
      }
      if (!this.skipMode) {
        const gs: GameState = JSON.parse(JSON.stringify(this.gameState));
        gs.animations = animations;
        this.nextGameStates.push(gs);
      }
      return of(true);
    }));
  }

  cardType(typeKey: Observable<string>, card: Observable<Card>): Observable<string> {
    return combineLatest([typeKey, card]).pipe(
      switchMap(([typeKey, card]) => {
        return of(card.cardType.types[typeKey]);
      }),
    );
  }

  addCardTargets(options: Observable<GameOption[]>, ...targets: Observable<{id: string}>[]): Observable<GameOption[]> {
    return combineLatest([options, ...targets]).pipe(switchMap(([options, ...targets]) => {
      for (let option of options) {
        option.cardTarget = targets;
      }
      return of(options);
    }));
  }

  cardOptions(cards: Observable<Card[]>, filter: Observable<(cards: Observable<Card[]>) => Observable<boolean>>, action: (cards: Observable<Card[]>) => Observable<any>): Observable<GameOption[]> {
    return combineLatest([cards, filter]).pipe(
      switchMap(([cards, filter]) => {
        return combineLatest(cards.map(card => filter(of([card])).pipe(map((filter) => ({card, filter}))))).pipe(
          switchMap((values) => {
            return of(values.filter((v) => v.filter).map((v) => ({card: v.card, action: action(of([v.card]))})));
          }),
        );
      }),
    );
  }

  choose(player: Observable<Player>, options: Observable<GameOption[]>, onEmpty: Observable<GameOption> = of({text: 'Pass', action: of(false)})): Observable<any> {
    return combineLatest([player, options]).pipe(switchMap(([player, options]) => {
      return this.controllers[player.id].choose(this.gameState!, this.nextGameStates, of(options), onEmpty).pipe(switchMap((option) => option.action));
    }));
  }

  length<T>(a: Observable<T[]>): Observable<number> {
    return a.pipe(switchMap((a) => of(a.length)));
  }

  first<T>(obs: Observable<T[]>): Observable<T> {
    return obs.pipe(switchMap((v) => of(v[0])));
  }

  add<T>(...obs: Observable<T>[]): Observable<T> {
    return combineLatest(obs).pipe(
      switchMap((v: any[]) => {
        let c = v[0];
        for (let i=1; i<v.length; i++) {
          c += v[i];
        }
        return of(c);
      })
    );
  }

  max(...obs: Observable<any>[]): Observable<boolean> {
    return combineLatest(obs).pipe(
      switchMap((v: any[]) => {
        let c = v[0];
        for (let i=1; i<v.length; i++) {
          if (v[i] > c) c = v[i];
        }
        return of(c);
      })
    );
  }

  min(...obs: Observable<any>[]): Observable<boolean> {
    return combineLatest(obs).pipe(
      switchMap((v: any[]) => {
        let c = v[0];
        for (let i=1; i<v.length; i++) {
          if (v[i] < c) c = v[i];
        }
        return of(c);
      })
    );
  }

  eq(...obs: Observable<any>[]): Observable<boolean> {
    return combineLatest(obs).pipe(
      switchMap((v: any[]) => {
        let c = v[0];
        for (let i=1; i<v.length; i++) {
          if (c != v[i]) return of(false);
        }
        return of(true);
      })
    );
  }

  leq(...obs: Observable<any>[]): Observable<boolean> {
    return combineLatest(obs).pipe(
      switchMap((v: any[]) => {
        for (let i=1; i<v.length; i++) {
          if (v[i-1] > v[i]) return of(false);
        }
        return of(true);
      })
    );
  }

  or(...obs: Observable<boolean>[]): Observable<boolean> {
    return combineLatest(obs).pipe(
      switchMap((v: boolean[]) => {
        return of(v.find((b) => b) !== undefined);
      })
    );
  }

  and(...obs: Observable<boolean>[]): Observable<boolean> {
    return combineLatest(obs).pipe(
      switchMap((v: boolean[]) => {
        return of(v.find((b) => !b) === undefined);
      })
    );
  }

  concat<T>(...obs: Observable<T[]>[]): Observable<T[]> {
    return combineLatest(obs).pipe(
      switchMap((v: any[]) => of([].concat.apply([], v))),
    );
  }

  if(condition: Observable<boolean>, yes: Observable<any>, no: Observable<any>=of(false)): Observable<any> {
    return condition.pipe(switchMap((b) => {
      if (b) return yes;
      return no;
    }));
  }

  sequential(...obs: Observable<any>[]): Observable<any> {
    return combineLatest(obs);
  }

  runFunction(f: string | undefined): Observable<any> {
    if (!this.gameState) throw Error('running undefined game state');
    if (f === undefined) throw Error('running undefined function');
    const func = Function("game", "of", "rv", 'rv[0]=' + f);
    const rv: (Observable<void> | undefined)[] = [undefined];
    func(this, of, rv);
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
