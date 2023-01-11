import { CardStackType } from "./card-stack-type";
import { CardType } from "./card-type";

export interface GameType {
  id?: string;
  cards?: {[key: string]: CardType};
  name: string;
  globalStacks: {[key: string]: CardStackType};
  playerStacks: {[key: string]: CardStackType};
  variables: {[key: string]: any};
  gameStart: string;
}
