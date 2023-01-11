import { Card } from "./card";
import { CardStackType } from "./card-stack-type";

export interface CardStack {
  type: CardStackType;
  cards: Card[];
};
