import { CardStack } from "./card-stack";

export interface Player {
  id: string;
  stacks: {[id: string]: CardStack};
}
