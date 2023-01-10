import { User } from "../room/user";
import { Packet } from "./packet";
import { PACKET_TYPES } from "./packet-types";
import { Visitor } from "./visitor";

export class JoinRoom extends Packet {
  constructor(public me: User) {
    super();
  }

  static override accept<T>(v: Visitor<T>, packet: Packet): T {
    return v.visitJoinRoom(<JoinRoom>packet);
  };
}
PACKET_TYPES.push(JoinRoom);
