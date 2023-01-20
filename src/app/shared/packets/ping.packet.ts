import { Packet } from "./packet";
import { PACKET_TYPES } from "./packet-types";
import { Visitor } from "./visitor";

export class PingPacket extends Packet {
  constructor(public start: number) {
    super();
  }

  static override accept<T>(v: Visitor<T>, packet: Packet): T {
    return v.visitPing(<PingPacket>packet);
  };
}
PACKET_TYPES.push(PingPacket);
