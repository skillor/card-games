import { GameOption } from "../games/game-option";
import { Packet } from "./packet";
import { PACKET_TYPES } from "./packet-types";
import { Visitor } from "./visitor";

export class GameOptionsPacket extends Packet {
  public gameOptions: GameOption[];
  constructor(gameOptions: GameOption[]) {
    super();
    this.gameOptions = gameOptions.map((option) => {
      if (option.id === undefined) option.id = Math.random().toString(36).substring(2);
      const clone = {...option};
      delete clone.action;
      return clone;
    });
  }

  static override accept<T>(v: Visitor<T>, packet: Packet): T {
    return v.visitGameOptions(<GameOptionsPacket>packet);
  };
}
PACKET_TYPES.push(GameOptionsPacket);
