import { User } from "./user";

export interface RoomState {
  users: {[key: string]: User};
  id: string;
}
