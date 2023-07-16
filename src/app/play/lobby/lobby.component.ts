import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest } from 'rxjs';
import { GameLoaderService } from 'src/app/shared/games/games-loader.service';
import { RoomService } from 'src/app/shared/room/room.service';
import { RoomState } from 'src/app/shared/room/room-state';
import { User } from 'src/app/shared/room/user';

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LobbyComponent implements OnInit {
  roomState?: RoomState;
  getGames$ = this.gamesService.getGames();

  constructor(
    private roomService: RoomService,
    private gamesService: GameLoaderService,
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
      if (roomState.state === 'playing') {
        this.zone.run(() => this.router.navigate(['play', roomState.selectedGame[0], roomState.id]));
        return;
      }
      this.roomState = roomState;
      this.changeDetector.detectChanges();
    });
  }

  isHost(): boolean {
    return this.roomService.isHost;
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
    this.gamesService.getGames().subscribe((gameTypes) => {
      if (this.roomState === undefined || !(target.value in gameTypes)) return;
      this.roomState.selectedGame = [target.value, gameTypes[target.value]];
      this.roomService.setRoomState(this.roomState);
    });
  }

  startGame(): void {
    if (this.roomState === undefined) return;
    this.roomState.state = 'playing';
    this.roomService.setRoomState(this.roomState);
  }
}
