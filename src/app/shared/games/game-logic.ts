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

  ToFunctionResult<T>(x: Observable<T>): Observable<FunctionResult> {
    return x;
  }

  getCardStack(id: Observable<string>, player: Observable<Player> | undefined): Observable<CardStack> {
    if (player !== undefined) return combineLatest([id, player]).pipe(switchMap(([id, player]) => of(player.stacks[id])));
    return id.pipe(switchMap((id) => of(this.game.gameState!.stacks[id])));
  }

  getGameVariable(id: Observable<string>): Observable<Variable> {
    return id.pipe(switchMap((id) => of(this.game.gameState!.variables[id].value)));
  }

  setGameVariable<T>(id: Observable<string>, value: Observable<T>): Observable<FunctionResult> {
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

  getCardsOfCardStack(stack: Observable<CardStack>): Observable<Card[]> {
    return stack.pipe(map((stack) => {
      console.log(stack.cards);
      return stack.cards;
    }));
  }

  topCards(stack: Observable<CardStack>, n: Observable<number> | undefined): Observable<Card[]> {
    if (n === undefined) n = of(1);
    return n.pipe(switchMap((n) => this.slice(this.getCardsOfCardStack(stack), of(-n), undefined)));
  }

  bottomCards(stack: Observable<CardStack>, n: Observable<number> | undefined): Observable<Card[]> {
    return this.slice(this.getCardsOfCardStack(stack), of(0), n ? n : of(1));
  }

  runAction(actionName: Observable<string>): Observable<FunctionResult> {
    return actionName.pipe(switchMap((actionKey) => {
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

  fillStack(stack: Observable<CardStack>, repeat: Observable<number> | undefined): Observable<FunctionResult> {
    if (repeat === undefined) repeat = of(1);
    return combineLatest([repeat, stack]).pipe(switchMap(([n, stack]) => {
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

  shuffleStack(stack: Observable<CardStack>): Observable<FunctionResult> {
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

  cardType(typeName: Observable<string>, card: Observable<Card>): Observable<string> {
    return combineLatest([typeName, card]).pipe(
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

  emptyOptions(): Observable<GameOption[]> {
    return of([]);
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

  isEmpty<T>(array: Observable<T[]>): Observable<boolean> {
    return array.pipe(switchMap((a) => of(a.length === 0)));
  }

  endGame(end: Observable<boolean>): Observable<FunctionResult> {
    return end.pipe(switchMap((end) => {
      this.game.gameState!.ended = end;
      return of(end);
    }));
  }

  map<T, T2>(array: Observable<T[]>, func: Observable<(o: Observable<T>) => Observable<T2>>): Observable<T2[]> {
    return combineLatest([array, func]).pipe(switchMap(([a, f]) => combineLatest(a.map((x) => f(of(x))))));
  }

  length<T>(array: Observable<T[]>): Observable<number> {
    return array.pipe(switchMap((a) => of(a.length)));
  }

  slice<T>(array: Observable<T[]>, start: Observable<number> | undefined, end: Observable<number> | undefined): Observable<T[]> {
    let startO: Observable<number | undefined>;
    if (start === undefined) startO = of(undefined);
    else startO = start;
    let endO: Observable<number | undefined>;
    if (end === undefined) endO = of(undefined);
    else endO = end;
    return combineLatest([array, startO, endO]).pipe(switchMap(([array, startO, endO]) => of(array.slice(startO, endO))));
  }

  first<T>(array: Observable<T[]>): Observable<T> {
    return array.pipe(switchMap((v) => of(v[0])));
  }

  add<T>(...summand: Observable<T>[]): Observable<T> {
    return combineLatest(summand).pipe(
      switchMap((v: any[]) => {
        let c = v[0];
        for (let i=1; i<v.length; i++) {
          c += v[i];
        }
        return of(c);
      })
    );
  }

  max<T>(...value: Observable<T>[]): Observable<T> {
    return combineLatest(value).pipe(
      switchMap((v: any[]) => {
        let c = v[0];
        for (let i=1; i<v.length; i++) {
          if (v[i] > c) c = v[i];
        }
        return of(c);
      })
    );
  }

  min<T>(...value: Observable<T>[]): Observable<T> {
    return combineLatest(value).pipe(
      switchMap((v: any[]) => {
        let c = v[0];
        for (let i=1; i<v.length; i++) {
          if (v[i] < c) c = v[i];
        }
        return of(c);
      })
    );
  }

  equals<T>(...value: Observable<T>[]): Observable<boolean> {
    return combineLatest(value).pipe(
      switchMap((v: any[]) => {
        let c = v[0];
        for (let i=1; i<v.length; i++) {
          if (c != v[i]) return of(false);
        }
        return of(true);
      })
    );
  }

  lessEquals<T>(...value: Observable<T>[]): Observable<boolean> {
    return combineLatest(value).pipe(
      switchMap((v: any[]) => {
        for (let i=1; i<v.length; i++) {
          if (v[i-1] > v[i]) return of(false);
        }
        return of(true);
      })
    );
  }

  or(...value: Observable<boolean>[]): Observable<boolean> {
    return combineLatest(value).pipe(
      switchMap((v: boolean[]) => {
        return of(v.find((b) => b) !== undefined);
      })
    );
  }

  and(...value: Observable<boolean>[]): Observable<boolean> {
    return combineLatest(value).pipe(
      switchMap((v: boolean[]) => {
        return of(v.find((b) => !b) === undefined);
      })
    );
  }

  concat<T>(...array: Observable<T[]>[]): Observable<T[]> {
    return combineLatest(array).pipe(
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

  ToArray<T>(...value: Observable<T>[]): Observable<T[]> {
    if (value.length == 1) return value[0].pipe(map((x)=>[x]));
    return value[0].pipe(
      concatMap((v) => this.ToArray(...value.slice(1)).pipe(map((x) => [v, ...x])),
    ));
  }

  sequential(...func: Observable<FunctionResult>[]): Observable<FunctionResult> {
    if (func.length == 1) return func[0];
    return func[0].pipe(
      concatMap((v) => this.sequential(...func.slice(1)),
    ));
  }
}
