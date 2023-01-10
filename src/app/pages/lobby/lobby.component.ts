import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest } from 'rxjs';
import { GamesService } from 'src/app/shared/games/games.service';
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

  getUsers(): User[] {
    if (this.roomState === undefined) return [];
    return Object.values(this.roomState.users);
  }

  leave(): void {
    this.roomService.disconnect();
    this.router.navigate(['home']);
  }
}
