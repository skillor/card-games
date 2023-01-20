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
  id?: string;
  cards?: {[key: string]: CardType};
  name: string;
  globalStacks: {[key: string]: CardStackType};
  playerStacks: {[key: string]: CardStackType};
  variables: {[key: string]: GameVariable};
  startPhase: string;
  gamePhases: {[key: string]: GamePhase};
  gameActions: {[key: string]: GameAction};
}
