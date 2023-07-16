import { Card } from "./card";
import { MCall } from "./game-logic";

export interface GameOption {
  id?: string;
  card?: Card;
  cardTargets?: {id: string}[];
  text?: string;
  action?: MCall<any>;
}
