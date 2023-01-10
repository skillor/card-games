import { Card } from "./card";

export interface Game {
  name: string;
  cards: {[key: number]: Card}
}
