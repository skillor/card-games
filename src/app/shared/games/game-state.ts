import { CardStack } from "./card-stack";
import { Player } from "./player";

export interface GameState {
  players: {[id: string]: Player};
  stacks: {[id: string]: CardStack};
  variables: {[key: string]: any};
}
