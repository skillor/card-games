import { Observable, combineLatest, switchMap, of, map, concatMap, merge } from "rxjs";
import { Animation } from "../animation/animation";
import { Card } from "./card";
import { CardStack } from "./card-stack";
import { Game } from "./game";
import { GameOption } from "./game-option";
import { GameState } from "./game-state";
import { Player } from "./player";

export type GameLogicHead = {
  types: string[];
  functions: FunctionHead[];
}
export type FunctionInputHead = {
  name: string,
  type: TypingHead,
  optional: boolean,
  dotdot: boolean
};
export type TypeHead = {
  name: string,
  isArray: boolean,
}
export type TypingOption = {
  type?: TypeHead,
  function?: FunctionHead,
}
export type TypingHead = {
  options: TypingOption[],
};
export type FunctionHead = {
  name: string,
  typeParameters: string[],
  inputs: FunctionInputHead[],
  outputType: TypingHead,
};

export type FunctionResult = any;
export type Variable = any;

export class GameLogic {
  constructor(
    private game: Game,
  ) { }

  ToString<T>(x: Observable<T>): Observable<string> {
    return x.pipe(map((x) => ""+x));
  }

  ToNumber<T>(x: Observable<T>): Observable<number> {
    return x.pipe(map((x) => +x));
  }

  ToBoolean<T>(x: Observable<T>): Observable<boolean> {
    return x.pipe(map((x) => !!x));
  }

  getStack(id: Observable<string>, player: Observable<Player> | undefined): Observable<CardStack> {
    if (player !== undefined) return combineLatest([id, player]).pipe(switchMap(([id, player]) => of(player.stacks[id])));
    return id.pipe(switchMap((id) => of(this.game.gameState!.stacks[id])));
  }

  getVariable(id: Observable<string>): Observable<Variable> {
    return id.pipe(switchMap((id) => of(this.game.gameState!.variables[id].value)));
  }

  setVariable<T>(id: Observable<string>, value: Observable<T>): Observable<FunctionResult> {
    return combineLatest([id, value]).pipe(
      switchMap(([id, value]) => {
        this.game.gameState!.variables[id].value = value;
        return of(true);
      })
    );
  }

  players(): Observable<Player[]> {
    return of(
      Object.values(this.game.gameState!.players)
      .sort((a, b) => this.game.gameState!.playerOrder.indexOf(a.id) - this.game.gameState!.playerOrder.indexOf(b.id))
    );
  }

  randomChoice<T>(options: Observable<T[]>): Observable<T> {
    return options.pipe(
      switchMap((options) => of(options[Math.floor(options.length * this.game.random())])),
    )
  }

  currentPlayer(): Observable<Player> {
    const playerId = this.game.gameState!.playerOrder[this.game.gameState!.playersTurn];
    return of(this.game.gameState!.players[playerId]);
  }

  nextPlayer(): Observable<Player> {
    return of(this.game.gameState!.players[this.game.gameState!.playerOrder[(this.game.gameState!.playersTurn + 1) % this.game.gameState!.playerOrder.length]]);
  }

  setPhase(player: Observable<Player>, phase: Observable<string>): Observable<FunctionResult> {
    return combineLatest([phase, player]).pipe(switchMap(([phase, player]) => {
      this.game.gameState!.playersTurn = this.game.gameState!.playerOrder.indexOf(player.id);
      this.game.gameState!.activePhase = phase;
      return of(true);
    }));
  }

  cards(stack: Observable<CardStack>): Observable<Card[]> {
    return stack.pipe(switchMap((stack) => {
      return of(stack.cards);
    }));
  }

  topCards(stack: Observable<CardStack>, n: Observable<number> | undefined): Observable<Card[]> {
    if (n === undefined) n = of(1);
    return combineLatest([n, stack]).pipe(switchMap(([n, stack]) => {
      return of(stack.cards.slice(-n));
    }));
  }

  bottomCards(stack: Observable<CardStack>, n: Observable<number> | undefined): Observable<Card[]> {
    if (n === undefined) n = of(1);
    return combineLatest([n, stack]).pipe(switchMap(([n, stack]) => of(stack.cards.slice(0, n))));
  }

  empty<T>(a: Observable<T[]>): Observable<boolean> {
    return a.pipe(switchMap((a) => of(a.length === 0)));
  }

  end(end: Observable<boolean>): Observable<FunctionResult> {
    return end.pipe(switchMap((end) => {
      this.game.gameState!.ended = end;
      return of(end);
    }));
  }

  runAction(actionKey: Observable<string>): Observable<FunctionResult> {
    return actionKey.pipe(switchMap((actionKey) => {
      if (actionKey in this.game.gameState!.actionCounter) this.game.gameState!.actionCounter[actionKey] += 1;
      else this.game.gameState!.actionCounter[actionKey] = 1;
      const action = this.game.gameType.gameActions[actionKey];
      if (!action || !action.action) return of(false);
      return this.game.runFunction(action.action);
    }));
  }

  moveCards(from: Observable<CardStack>, to: Observable<CardStack>, cards: Observable<Card[]>): Observable<FunctionResult> {
    return combineLatest([from, to, cards]).pipe(switchMap(([from, to, cards]) => {
      for (let wCard of cards) {
        let cardI = from.cards.findIndex((card) => card.id === wCard.id);
        if (cardI === -1) continue;
        let gs: GameState;
        if (!this.game.skipMode) {
          gs = JSON.parse(JSON.stringify(this.game.gameState));
        }
        let card = from.cards.splice(cardI, 1)[0];
        to.cards.push(card);
        if (!this.game.skipMode) {
          gs!.animations.push({fromId: card.id, toId: to.id, targetId: card.id, type: 'fly', duration: 100, next: 50});
          this.game.nextGameStates.push(gs!);
        }
      }
      return of(true);
    }));
  }

  populate(stack: Observable<CardStack>, n: Observable<number> | undefined): Observable<FunctionResult> {
    if (n === undefined) n = of(1);
    return combineLatest([n, stack]).pipe(switchMap(([n, stack]) => {
      const animations: Animation[] = [];
      stack.cards = [];
      for (let cardType of Object.values(this.game.gameType.cards!)) {
        for (let i=0; i < n; i++) {
          const card = {cardType: cardType, id: this.game.createHash()};
          stack.cards.push(card);
          if (!this.game.skipMode) animations.push({fromId: null, toId: card.id, targetId: card.id, type: 'fly', duration: 100, next: 10});
        }
      }
      if (!this.game.skipMode) {
        const gs: GameState = JSON.parse(JSON.stringify(this.game.gameState));
        gs.animations = animations;
        this.game.nextGameStates.push(gs);
      }
      return of(true);
    }));
  }

  shuffle(stack: Observable<CardStack>): Observable<FunctionResult> {
    return stack.pipe(switchMap((stack) => {
      const animations: Animation[] = [];
      for (let i = stack.cards.length - 1; i > 0; i--) {
        const j = Math.floor(this.game.random() * (i + 1));
        [stack.cards[i], stack.cards[j]] = [stack.cards[j], stack.cards[i]];
        if (!this.game.skipMode) {
          animations.push({fromId: stack.cards[j].id, toId: null, targetId: stack.cards[j].id, type: 'shuffle', duration: 100, next: 1});
          animations.push({fromId: stack.cards[j].id, toId: null, targetId: stack.cards[i].id, type: 'shuffle', duration: 100, next: 1});
        }
      }
      if (!this.game.skipMode) {
        const gs: GameState = JSON.parse(JSON.stringify(this.game.gameState));
        gs.animations = animations;
        this.game.nextGameStates.push(gs);
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

  addCardStackTargets(options: Observable<GameOption[]>, targets: Observable<CardStack[]>): Observable<GameOption[]> {
    return combineLatest([options, targets]).pipe(switchMap(([options, targets]) => {
      for (let option of options) {
        if (!option.cardTargets) option.cardTargets = [];
        option.cardTargets.push(...targets);
      }
      return of(options);
    }));
  }

  textOption(text: Observable<string>, action: Observable<() => Observable<FunctionResult>>): Observable<GameOption> {
    return text.pipe(
      switchMap((text) => of({text: text, action: action.pipe(switchMap((action) => action()))})),
    );
  }

  cardOptions(cards: Observable<Card[]>, filter: Observable<(cards: Observable<Card[]>) => Observable<boolean>>, action: Observable<(cards: Observable<Card[]>) => Observable<FunctionResult>>): Observable<GameOption[]> {
    return combineLatest([cards, filter]).pipe(
      switchMap(([cards, filter]) => {
        return combineLatest(cards.map(card => filter(of([card])).pipe(map((filter) => ({card, filter}))))).pipe(
          switchMap((values) => {
            return of(values.filter((v) => v.filter).map((v) => ({card: v.card, action: action.pipe(switchMap((action) => action(of([v.card]))))})));
          }),
        );
      }),
    );
  }

  choose(player: Observable<Player>, options: Observable<GameOption[]>, onEmpty: Observable<GameOption> | undefined): Observable<FunctionResult> {
    if (onEmpty === undefined) onEmpty = of({text: 'Pass', action: of(false)});
    return combineLatest([player, options]).pipe(switchMap(([player, options]) => {
      return this.game.controllers[player.id].choose(this.game.gameState!, this.game.nextGameStates, of(options), onEmpty!).pipe(switchMap((option) => {
        if (option.action === undefined) return of(false);
        return option.action;
      }));
    }));
  }

  map<T, T2>(a: Observable<T[]>, f: Observable<(o: Observable<T>) => Observable<T2>>): Observable<T2[]> {
    return combineLatest([a, f]).pipe(switchMap(([a, f]) => combineLatest(a.map((x) => f(of(x))))));
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

  max<T>(...obs: Observable<T>[]): Observable<T> {
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

  min<T>(...obs: Observable<T>[]): Observable<T> {
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

  eq<T>(...obs: Observable<T>[]): Observable<boolean> {
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

  leq<T>(...obs: Observable<T>[]): Observable<boolean> {
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

  if<T>(condition: Observable<boolean>, yes: Observable<T>, no: Observable<T> | undefined=undefined): Observable<T> {
    return condition.pipe(switchMap((b) => {
      if (b) return yes;
      if (no !== undefined) return no;
      return of(<any>false);
    }));
  }

  ToArray<T>(...obs: Observable<T>[]): Observable<T[]> {
    if (obs.length == 1) return obs[0].pipe(map((x)=>[x]));
    return obs[0].pipe(
      concatMap((v) => this.ToArray(...obs.slice(1)).pipe(map((x) => [v, ...x])),
    ));
  }

  sequential(...obs: Observable<FunctionResult>[]): Observable<FunctionResult> {
    if (obs.length == 1) return obs[0];
    return obs[0].pipe(
      concatMap((v) => this.sequential(...obs.slice(1)),
    ));
  }
}
