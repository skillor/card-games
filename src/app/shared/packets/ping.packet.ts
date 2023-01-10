import { Packet } from "./packet";
import { PACKET_TYPES } from "./packet-types";
import { Visitor } from "./visitor";

export class Ping extends Packet {
  constructor(public start: number) {
    super();
  }

  static override accept<T>(v: Visitor<T>, packet: Packet): T {
    return v.visitPing(<Ping>packet);
  };
}
PACKET_TYPES.push(Ping);
