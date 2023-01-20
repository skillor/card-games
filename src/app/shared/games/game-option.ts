import { Observable } from "rxjs";
import { Card } from "./card";

export interface GameOption {
  id?: string;
  card?: Card;
  cardTargets?: {id: string}[];
  text?: string;
  action?: Observable<any>;
}
