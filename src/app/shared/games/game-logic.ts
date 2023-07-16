import { Card } from "./card";
import { CardStack } from "./card-stack";
import { Game } from "./game";
import { GameOption } from "./game-option";
import { Player } from "./player";

export type GameLogicHead = {
  types: string[];
  functions: {[key: string]: FunctionHead};
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

export class MCall<T> {
  constructor(private d: () => Promise<T>) {
  }

  async call(): Promise<T> {
    console.log('call1');
    let t = await this.d();
    console.log('call2', JSON.stringify(t));
    return t;
  }

  then<T2>(c: (x: T) => Promise<T2>): MCall<T2> {
    return new MCall<T2>(async () => await c(await this.call()));
  }

  switch<T2>(c: (x: T) => Promise<MCall<T2>>): MCall<T2> {
    // return new Call(async () => (await c((await this.call()))).call());
    return new MCall(async () => {
      return await (<any>(await c((await this.call())))).call();
    });
    // return new Call(async () => <T2>0);
  }

  static all<T>(value: MCall<any>[]): MCall<T> {
    return new MCall<any>(async () => {
      const r = [];
      for (const f of value) {
        console.log('all1');
        r.push(await f.call());
        console.log('all2');
      }
      return r;
    });
  }


}

export class GameLogic {
  constructor(
    private game: Game,
  ) { }

  of<T>(x: T): MCall<T> {
    return new MCall(async () => x);
  }

  ToString<T>(x: MCall<T>): MCall<string> {
    return x.then(async y => String(y));
  }

  ToNumber<T>(x: MCall<T>): MCall<number> {
    return x.then(async y => Number(y));
  }

  ToBoolean<T>(x: MCall<T>): MCall<boolean> {
    return x.then(async y => Boolean(y));
  }

  ToArray<T>(...value: MCall<T>[]): MCall<T[]> {
    return MCall.all(value);
  }

  ToFunctionResult<T>(x: MCall<T>): MCall<FunctionResult> {
    return x;
  }

  getPlayerCardStack(id: MCall<string>, player: MCall<Player> | undefined): MCall<CardStack> {
    if (player === undefined) player = this.currentPlayer();
    return MCall.all<[Player, string]>([player, id]).then(async ([p, i]) => p.stacks[i]);
  }

  getGlobalCardStack(id: MCall<string>): MCall<CardStack> {
    return id.then(async i => this.game.gameState!.stacks[i]);
  }

  getGameVariable(id: MCall<string>): MCall<Variable> {
    return id.then(async i => this.game.gameState!.variables[i].value);
  }

  setGameVariable<T>(id: MCall<string>, value: MCall<T>): MCall<FunctionResult> {
    return MCall.all<[string, T]>([id, value]).then(async ([i, v]) => this.game.gameState!.variables[i].value = v);
  }

  players(): MCall<Player[]> {
    return new MCall(async () => Object.values(this.game.gameState!.players).sort((a, b) => this.game.gameState!.playerOrder.indexOf(a.id) - this.game.gameState!.playerOrder.indexOf(b.id)));
  }

  randomChoice<T>(options: MCall<T[]>): MCall<T> {
    return options.then(async o => o[Math.floor(o.length * this.game.random())]);
  }

  currentPlayer(): MCall<Player> {
    const playerId = this.game.gameState!.playerOrder[this.game.gameState!.playersTurn];
    return new MCall(async () => this.game.gameState!.players[playerId]);
  }

  nextPlayer(): MCall<Player> {
    return new MCall(async () => this.game.gameState!.players[this.game.gameState!.playerOrder[(this.game.gameState!.playersTurn + 1) % this.game.gameState!.playerOrder.length]]);
  }

  setPhase(player: MCall<Player>, phase: MCall<string>): MCall<FunctionResult> {
    return MCall.all<[Player, string]>([player, phase]).then(async ([p, ph]) => {
      this.game.gameState!.playersTurn = this.game.gameState!.playerOrder.indexOf(p.id);
      this.game.gameState!.activePhase = ph;
      return true;
    });
  }

  getCardsOfCardStack(stack: MCall<CardStack>): MCall<Card[]> {
    return stack.then(async s => s.cards);
  }

  topCards(stack: MCall<CardStack>, n: MCall<number> | undefined): MCall<Card[]> {
    if (n === undefined) n = this.of(1);
    return this.slice(this.getCardsOfCardStack(stack), n.then(async x => -x), undefined);
  }

  bottomCards(stack: MCall<CardStack>, n: MCall<number> | undefined): MCall<Card[]> {
    return this.slice(this.getCardsOfCardStack(stack), this.of(0), n ? n : this.of(1));
  }

  runAction(actionName: MCall<string>): MCall<FunctionResult> {
    return actionName.switch(async (a) => {
      if (!a) return this.of(false);
      return new MCall(() => this.game.runFunction(a));
    });
  }

  moveCards(from: MCall<CardStack>, to: MCall<CardStack>, fromCards: MCall<Card[]> | undefined = undefined): MCall<FunctionResult> {
    if (fromCards === undefined) fromCards = from.then(async x => x.cards);
    return MCall.all<[CardStack, CardStack, Card[]]>([from, to, fromCards]).then(async ([_from, _to, _fromCards]) => {
      for (let c of _fromCards) {
        const ci = _from.cards.findIndex((card) => card.id === c.id);
        if (ci === -1) continue;
        _from.cards.splice(ci, 1);
        _to.cards.push(c);
      }
      return true;
    });
  }

  swapCards(from: MCall<CardStack>, to: MCall<CardStack>, fromCards: MCall<Card[]> | undefined = undefined, toCards: MCall<Card[]> | undefined = undefined): MCall<FunctionResult> {
    if (fromCards === undefined) fromCards = from.then(async x => x.cards);
    if (toCards === undefined) toCards = to.then(async x => x.cards);

    return MCall.all([this.moveCards(from, to, fromCards), this.moveCards(to, from, toCards)]);
  }

  fillStack(stack: MCall<CardStack>, repeat: MCall<number> | undefined): MCall<FunctionResult> {
    if (repeat === undefined) repeat = this.of(1);

    return MCall.all<[CardStack, number]>([stack, repeat]).then(async ([_stack, n]) => {
      console.log('filling stack');
      _stack.cards = [];
      for (let cardType of Object.values(this.game.gameType.cards!)) {
        for (let i = 0; i < n; i++) {
          const card = { cardType: cardType, id: this.game.createHash() };
          _stack.cards.push(card);
        }
      }
    });
  }

  shuffleStack(stack: MCall<CardStack>): MCall<FunctionResult> {
    return stack.then(async _stack => {
      for (let i = _stack.cards.length - 1; i > 0; i--) {
        const j = Math.floor(this.game.random() * (i + 1));
        [_stack.cards[i], _stack.cards[j]] = [_stack.cards[j], _stack.cards[i]];
      }
    });
  }

  cardType(typeName: MCall<string>, card: MCall<Card>): MCall<string> {
    return MCall.all<[string, Card]>([typeName, card]).then(async ([t, c]) => c.cardType.types[t]);
  }

  addCardStackTargets(options: MCall<GameOption[]>, targets: MCall<CardStack[]>): MCall<GameOption[]> {
    return MCall.all<[GameOption[], CardStack[]]>([options, targets]).then(async ([_options, _targets]) => {
      for (let option of _options) {
        if (!option.cardTargets) option.cardTargets = [];
        option.cardTargets.push(..._targets);
      }
      return _options;
    });
  }

  emptyOptions(): MCall<GameOption[]> {
    return this.of([]);
  }

  textOption(text: MCall<string>, action: MCall<() => MCall<FunctionResult>>): MCall<GameOption> {
    return MCall.all<[string, () => MCall<FunctionResult>]>([text, action]).then(async ([text, action]) => ({text, action: action()}));
  }

  cardOptions(cards: MCall<Card[]>, action: MCall<(cards: MCall<Card[]>) => MCall<FunctionResult>>): MCall<GameOption[]> {
    return cards.then(async c => c.map((card) => ({ card, action })));
  }

  choose(player: MCall<Player>, options: MCall<GameOption[]>, onEmpty: MCall<GameOption> | undefined): MCall<FunctionResult> {
    if (onEmpty === undefined) onEmpty = this.of<GameOption>({ text: 'Pass', action: this.of(false) });
    return MCall.all<[Player, GameOption[], GameOption]>([player, options, onEmpty]).switch(async ([_player, _options, _onEmpty]) => {
      return new MCall(async () => await this.game.controllers[_player.id].choose(this.game.gameState!, _options, _onEmpty)).switch<any>(async r => {
        if (r.action === undefined) return this.of(false);
        return r.action;
      });
    });
  }

  isEmpty<T>(array: MCall<T[]>): MCall<boolean> {
    return this.equals(this.length(array), this.of(0));
  }

  endGame(end: MCall<boolean>): MCall<FunctionResult> {
    return end.then(async e => this.game.gameState!.ended = e);
  }

  filter<T>(array: MCall<T[]>, filter: MCall<(con: MCall<T>) => MCall<boolean>>): MCall<T[]> {
    return MCall.all<[T[], (_: MCall<T>) => MCall<boolean>]>([array, filter]).then(async ([a, f]) => a.filter((x) => f(this.of(x))));
  }

  map<T, T2>(array: MCall<T[]>, func: MCall<(x: MCall<T>) => MCall<T2>>): MCall<T2[]> {
    return MCall.all<[T[], (_: MCall<T>) => MCall<T2>]>([array, func]).switch(async ([a, f]) => <any>MCall.all(a.map((x) => f(this.of(x)))));
  }

  length<T>(array: MCall<T[]>): MCall<number> {
    return array.then(async x => x.length);
  }

  slice<T>(array: MCall<T[]>, start: MCall<number> | undefined, end: MCall<number> | undefined): MCall<T[]> {
    let startO: MCall<number | undefined>;
    if (start === undefined) startO = this.of(undefined);
    else startO = start;
    let endO: MCall<number | undefined>;
    if (end === undefined) endO = this.of(undefined);
    else endO = end;
    return MCall.all<[T[], number, number]>([array, startO, endO]).then(async ([a, x, y]) => a.slice(x, y));
  }

  first<T>(array: MCall<T[]>): MCall<T> {
    return array.then(async a => a[0]);
  }

  add<T>(...summand: MCall<T>[]): MCall<T> {
    return MCall.all<T[]>(summand).then(async x => x.reduce((a, b) => <any>a + b));
  }

  max<T>(...value: MCall<T>[]): MCall<T> {
    return MCall.all<T[]>(value).then(async x => x.reduce((a, b) => a > b ? a : b));

  }

  min<T>(...value: MCall<T>[]): MCall<T> {
    return MCall.all<T[]>(value).then(async x => x.reduce((a, b) => a < b ? a : b));

  }

  equals<T>(...value: MCall<T>[]): MCall<boolean> {
    return MCall.all<T[]>(value).then(async x => {
        for (let i=1; i<x.length; i++) {
          if (x[i-1] != x[i]) return false;
        }
        return true;
    });
  }

  lessEquals<T>(...value: MCall<T>[]): MCall<boolean> {
    return MCall.all<T[]>(value).then(async x => {
      for (let i=1; i<x.length; i++) {
        if (x[i-1] > x[i]) return false;
      }
      return true;
    });
  }

  or<T>(...value: MCall<T>[]): MCall<boolean> {
    return MCall.all<T[]>(value).then(async x => {
      for (let v of x) {
        if (v) return true;
      }
      return false;
    });
  }

  and<T>(...value: MCall<T>[]): MCall<boolean> {
    return MCall.all<T[]>(value).then(async x => {
      for (let v of x) {
        if (!v) return false;
      }
      return true;
    });
  }

  concat<T>(...array: MCall<T[]>[]): MCall<T[]> {
    return MCall.all<T[]>(array).then(async x => (<T[]>[]).concat(...x));
  }

  iff<T>(condition: MCall<boolean>, yes: MCall<T>, no: MCall<T>): MCall<T> {
    if (no === undefined) no = this.of(<any>true);
    return condition.switch(<any>(async (x: any) => (x ? yes : no)));
  }

  sequential(...func: MCall<FunctionResult>[]): MCall<FunctionResult> {
    return MCall.all(func);
  }
}
