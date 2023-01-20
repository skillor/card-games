import { GameState } from "../games/game-state";
import { GameType } from "../games/game-type";
import { User } from "./user";

export interface RoomState {
  users: {[key: string]: User};
  state: 'lobby' | 'playing';
  gameState?: GameState,
  selectedGame: GameType;
  id: string;
}
