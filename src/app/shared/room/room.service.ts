import { Injectable } from '@angular/core';
import Peer from 'peerjs';
import { fromEvent, Observable, switchMap, map, take, timeout } from 'rxjs';

@Injectable()
export class RoomService {
  private peer!: Peer;
  public isHost = false;
  public id?: string;
  public roomId?: string = undefined;

  constructor() { }

  isConnected(): boolean {
    return this.roomId !== undefined;
  }

  disconnect() {
    this.roomId = undefined;
  }

  createRoom(username: string): Observable<string> {
    this.peer = new Peer();
    return fromEvent(this.peer, 'open').pipe(
      take(1),
      map((id) => {
        this.id = String(id);
        this.roomId = this.id;
        this.isHost = true;
        return this.roomId;
      })
    );
  }

  joinRoom(username: string, roomId: string): Observable<string> {
    this.peer = new Peer();
    return fromEvent(this.peer, 'open').pipe(
      take(1),
      switchMap((id) => {
        const conn = this.peer.connect(roomId);
        return fromEvent(conn, 'open').pipe(
          timeout(2000),
          take(1),
          map(() => {
            this.id = String(id);
            this.roomId = roomId;
            this.isHost = false;
            return this.roomId;
          }),
        );
      }),
    );
  }
}
