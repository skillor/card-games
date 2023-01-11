import { CardStack } from "./card-stack";

export interface Player {
 stacks: {[id: string]: CardStack};
}
