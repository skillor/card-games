import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, map, of, skipWhile, Subscription, switchMap } from 'rxjs';
import { GamesService } from 'src/app/shared/games/games.service';
import { RoomService } from 'src/app/shared/room/room.service';
import { RoomState } from 'src/app/shared/room/room.state';

@Component({
  selector: 'app-play',
  templateUrl: './play.component.html',
  styleUrls: ['./play.component.scss']
})
export class PlayComponent implements OnInit, OnDestroy {

  subscription?: Subscription;
  roomState?: RoomState;

  constructor(
    private gamesService: GamesService,
    private roomService: RoomService,
    private route: ActivatedRoute,
    private router: Router,
    private zone: NgZone,
  ) { }

  isHost(): boolean {
    return this,this.roomState === undefined || this.roomService.isHost;
  }

  ngOnInit(): void {
    this.subscription = combineLatest([this.roomService.roomState, this.route.paramMap]).pipe(
      switchMap(([roomState, params]) => {
        const roomId = params.get('id');
        if (roomState === undefined && roomId !== null) {
          this.zone.run(() => this.router.navigate(['join', roomId]));
          return of(undefined);
        }
        this.roomState = roomState;
        const gameId = params.get('game');
        if (!gameId || !this.isHost()) return of(undefined);
        return this.gamesService.getGameType(gameId).pipe(
          switchMap((gameType) => this.gamesService.createGame(gameType)),
        );
      }),
      // swi
    ).subscribe((game) => {
      if (game === undefined)
      console.log(game);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
