import { GameType } from "../games/game-type";
import { User } from "./user";

export interface RoomState {
  users: {[key: string]: User};
  selectedGame: GameType;
  id: string;
}
