import { KeyValue } from "@angular/common";
import { GameState } from "../games/game-state";
import { User } from "./user";

export interface RoomState {
  users: {[key: string]: User};
  state: 'lobby' | 'playing';
  gameState?: GameState,
  selectedGame: [string, string];
  id: string;
}
