import { CardStackType } from "./card-stack-type";
import { CardType } from "./card-type";

export interface GamePhase {
  action: string;
}


export interface GameAction {
  actionFile?: string;
  action?: string;
}

export interface GameVariable {
  value: any,
}

export interface GameType {
  id: string;
  name: string;
  defaultCard: CardType;
  cards: {[key: string]: CardType};
  globalStacks: {[key: string]: CardStackType};
  playerStacks: {[key: string]: CardStackType};
  variables: {[key: string]: GameVariable};
  startPhase: string;
  gamePhases: {[key: string]: GamePhase};
  gameActions: {[key: string]: string};
}
