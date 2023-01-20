import { Animation } from "../animation/animation";
import { CardStack } from "./card-stack";
import { Player } from "./player";

export interface GameState {
  ended: boolean;
  waiting: boolean;
  actionCounter: {[id: string]: number};
  phaseCounter: {[id: string]: number};
  animations: Animation[];
  players: {[id: string]: Player};
  stacks: {[id: string]: CardStack};
  variables: {[key: string]: any};
  playerOrder: string[];
  playersTurn: number;
  activePhase: string | undefined;
}
