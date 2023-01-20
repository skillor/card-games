import { Injectable } from '@angular/core';
import Peer, { DataConnection } from 'peerjs';
import { fromEvent, Observable, switchMap, map, first, timeout, BehaviorSubject, interval, Subject, catchError, of } from 'rxjs';
import { JoinRoom } from '../packets/join-room.packet';
import { Packet } from '../packets/packet';
import { HostVisitor } from './host.visitor';
import { ClientVisitor } from './client.visitor';
import { RoomState } from './room.state';
import { User } from './user';
import { RoomState as RoomStatePacket } from '../packets/room-state.packet';
import { Ping } from '../packets/ping.packet';
import { GamesService } from '../games/games.service';

@Injectable()
export class RoomService {
  private peer!: Peer;
  public isHost = false;
  public id?: string;
  public me?: User;
  public roomState = new BehaviorSubject<RoomState | undefined>(undefined);
  private connections: {[key: string]: DataConnection} = {};
  private awaitingPackages: {[key: string]: Subject<Packet>} = {};
  private pingInterval = 5000;
  private pingTimeout = 3000;

  constructor(
    private gamesService: GamesService,
  ) {
    interval(this.pingInterval).subscribe(() => {
      this.pingConnections();
    })
  }

  sendWaitResponse(conn: DataConnection, packet: Packet): Observable<Packet> {
    const hash = Math.random().toString(36).substring(2);
    const subject = new Subject<Packet>();
    this.awaitingPackages[hash] = subject;
    packet.id = hash;
    conn.send(packet);
    return subject.pipe(first());
  }

  pingConnection(conn: DataConnection) {
    this.sendWaitResponse(conn, new Ping(Date.now())).pipe(
      timeout(this.pingTimeout),
      catchError(() => {
        this.disconnectUser(conn.connectionId);
        return of(undefined);
      })
    ).subscribe((packet) => {
      if (packet === undefined) return;
      Packet.accept(new HostVisitor(this, conn), packet);
    });
  }

  pingConnections() {
    for (let conn of Object.values(this.connections)) {
      this.pingConnection(conn);
    }
  }

  disconnect() {
    this.roomState.next(undefined);
    this.connections = {};
    if (this.peer) {
      this.peer.destroy();
    }
  }

  disconnectUser(connId: string) {
    this.roomState.pipe(
      first()
    ).subscribe((roomState) => {
      if (roomState === undefined) return;
      if (connId in this.connections) {
        this.connections[connId].close();
        delete this.connections[connId];
      }
      if (connId in roomState.users) {
        delete roomState.users[connId];
        this.roomState.next(roomState);
        this.broadcast(new RoomStatePacket(roomState));
      }
    });
  }

  broadcast(packet: Packet) {
    for (let conn of Object.values(this.connections)) {
      conn.send(packet);
    }
  }

  setupHostConnection(conn: DataConnection) {
    this.connections[conn.connectionId] = conn;
    const v = new HostVisitor(this, conn);
    fromEvent(conn, 'close').subscribe(() => {
      this.disconnectUser(conn.connectionId);
    });
    fromEvent(conn, 'error').subscribe((err) => {
      console.error(err);
    });
    fromEvent(conn, 'data').subscribe((data) => {
      const packet = <Packet>data;
      if (packet.id !== undefined && packet.id in this.awaitingPackages) {
        this.awaitingPackages[packet.id].next(packet);
        return;
      }
      Packet.accept(v, packet);
    });
  }

  setupClientConnection(conn: DataConnection) {
    conn.send(new JoinRoom(this.me!));
    const v = new ClientVisitor(this, conn);
    fromEvent(conn, 'close').subscribe(() => {
      this.disconnect();
    });
    fromEvent(conn, 'error').subscribe((err) => {
      console.error(err);
    });
    fromEvent(conn, 'data').subscribe((data) => {
      const packet = <Packet>data;
      if (packet.id !== undefined && packet.id in this.awaitingPackages) {
        this.awaitingPackages[packet.id].next(packet);
        return;
      }
      Packet.accept(v, packet);
    });
  }

  createRoom(username: string): Observable<string> {
    return this.gamesService.getGameTypes().pipe(
      switchMap((gameTypes) => {
        this.peer = new Peer();
        return fromEvent(this.peer, 'open').pipe(
          first(),
          map((id) => {
            this.id = String(id);
            this.me = {name: username, ping: 0};
            this.isHost = true;
            this.roomState.next({
              users: {[this.id]: this.me},
              id: this.id,
              selectedGame: gameTypes[Object.keys(gameTypes)[0]],
            });
            fromEvent(this.peer, 'connection').subscribe((conn) => this.setupHostConnection(<DataConnection>conn));
            return this.id;
          })
        );
      })
    )
  }

  joinRoom(username: string, roomId: string): Observable<string> {
    this.peer = new Peer();
    return fromEvent(this.peer, 'open').pipe(
      first(),
      switchMap((id) => {
        const conn = this.peer.connect(roomId);
        return fromEvent(conn, 'open').pipe(
          timeout(2000),
          first(),
          switchMap(() => {
            this.id = String(id);
            this.me = {name: username, ping: -1};
            this.isHost = false;
            this.setupClientConnection(conn);
            return this.roomState.pipe(
              first((roomState) => roomState !== undefined),
              timeout(2000),
              map((roomState) => {
                if (roomState === undefined) throw new Error('Could not connect');
                return roomState.id;
              })
            );
          }),
        );
      }),
    );
  }

  setRoomState(roomState: RoomState): void {
    this.roomState.next(roomState);
    this.broadcast(new RoomStatePacket(roomState));
  }
}
