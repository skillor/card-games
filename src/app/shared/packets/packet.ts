import { PACKET_TYPES } from "./packet-types";
import { Visitor } from "./visitor";

export abstract class Packet {
  private type: string;
  public id?: string;
  constructor() {
    this.type = this.constructor.name;
  }

  static accept<T>(v: Visitor<T>, packet: Packet): T {
    for (let packetType of PACKET_TYPES) {
      if (packetType.name === packet.type) return packetType.accept(v, packet);
    }
    throw new Error('got undefined packet: ' + packet.type)
  };
}
