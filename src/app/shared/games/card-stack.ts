import { Card } from "./card";
import { CardStackType } from "./card-stack-type";

export interface CardStack {
  gameId: string;
  id: string;
  type: CardStackType;
  cards: Card[];
};
