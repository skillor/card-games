import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, first, Observable, switchMap } from 'rxjs';
import { GamesService } from 'src/app/shared/games/games.service';
import { GameType } from 'src/app/shared/games/game-type';
import { RoomService } from 'src/app/shared/room/room.service';
import { RoomState } from 'src/app/shared/room/room.state';
import { User } from 'src/app/shared/room/user';

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LobbyComponent implements OnInit {
  roomState?: RoomState;

  constructor(
    private roomService: RoomService,
    private gamesService: GamesService,
    private router: Router,
    private route: ActivatedRoute,
    private changeDetector: ChangeDetectorRef,
    private zone: NgZone,
  ) {
  }

  ngOnInit(): void {
    combineLatest([this.roomService.roomState, this.route.paramMap]).subscribe(([roomState, params]) => {
      const roomId = params.get('id');
      if (roomState === undefined) {
        this.zone.run(() => this.router.navigate(['join', roomId]));
        return;
      }
      this.roomState = roomState;
      this.changeDetector.detectChanges();
    });
  }

  isHost(): boolean {
    return this.roomService.isHost;
  }

  getGameTypes(): Observable<{[id: string]: GameType}> {
    return this.gamesService.getGameTypes();
  }

  getUsers(): User[] {
    if (this.roomState === undefined) return [];
    return Object.values(this.roomState.users);
  }

  leave(): void {
    this.roomService.disconnect();
    this.router.navigate(['home']);
  }

  changeGameType(target: any): void {
    if (!target || !target.value) return;
    this.getGameTypes().subscribe((gameTypes) => {
      if (this.roomState === undefined || !(target.value in gameTypes)) return;
      this.roomState.selectedGame = gameTypes[target.value];
      this.roomService.setRoomState(this.roomState);
    });
  }
}
