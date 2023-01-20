import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, concatMap, first, map, of, Subscription, switchMap, takeWhile, tap } from 'rxjs';
import { GameState } from 'src/app/shared/games/game-state';
import { GamesService } from 'src/app/shared/games/games.service';
import { HumanController } from 'src/app/shared/games/human-controller';
import { RandomController } from 'src/app/shared/games/random-controller';
import { RoomService } from 'src/app/shared/room/room.service';
import { RoomState } from 'src/app/shared/room/room-state';
import { AnimationService } from 'src/app/shared/animation/animation.service';
import { Controller } from 'src/app/shared/games/controller';
import { RemoteController } from 'src/app/shared/games/remote-controller';

@Component({
  selector: 'app-play',
  templateUrl: './play.component.html',
  styleUrls: ['./play.component.scss']
})
export class PlayComponent implements OnInit, OnDestroy {

  subscription?: Subscription;
  roomState?: RoomState;
  gameState?: GameState;

  constructor(
    private animationService: AnimationService,
    private gamesService: GamesService,
    private roomService: RoomService,
    private route: ActivatedRoute,
    private router: Router,
    private zone: NgZone,
  ) { }

  isLocal(): boolean {
    return this.roomState === undefined;
  }

  isHost(): boolean {
    return this.isLocal() || this.roomService.isHost;
  }

  ngOnInit(): void {
    this.subscription = combineLatest([this.roomService.roomState, this.route.paramMap]).pipe(
      tap(([roomState, params]) => this.roomState = roomState),
      first(),
      switchMap(([roomState, params]) => {
        const roomId = params.get('id');
        if (roomState === undefined && roomId !== null) {
          this.zone.run(() => this.router.navigate(['join', roomId]));
          return of(undefined);
        }
        const gameId = params.get('game');
        if (!gameId || !this.isHost()) return of(undefined);
        return this.gamesService.getGameType(gameId).pipe(
          switchMap((gameType) => this.gamesService.createGame(gameType)),
        );
      }),
      switchMap((game) => {
        this.gamesService.setMeVisibility([this.roomService.me ? this.roomService.me.name : 'Player']);
        if (game) {
          game.skipMode = false;
          if (this.roomState) {
            game.createGameState(Object.values(this.roomState.users).map((user) => user.name));
            game.controllers = {};
            for (let userId of Object.keys(this.roomState.users)) {
              const user = this.roomState.users[userId];
              if (userId == this.roomService.id) {
                game.controllers[user.name] = new HumanController(this.gamesService);
              } else {
                game.controllers[user.name] = new RemoteController(this.gamesService, this.roomService, userId);
              }
            }
          } else {
            game.createGameState(['Player', 'AI1', 'AI2']);
            game.controllers = {
              'Player': new HumanController(this.gamesService),
              // 'Player': new RandomController(),
              'AI1': new RandomController(),
              'AI2': new RandomController(),
            };
          }
          game.setSeed('seed');
          return this.gamesService.autoPlay(game).pipe(
            map((v) => {
              if (!v.isAnimation) {
                this.roomService.roomState.pipe(first()).subscribe((roomState) => {
                  if (!roomState) return;
                  roomState.gameState = v.gameState;
                  this.roomService.setRoomState(roomState);
                });
              }
              return v.gameState;
            }),
          );
        }
        return this.roomService.roomState.pipe(
          concatMap((v) => {
            if (!v || !v.gameState) return of(undefined);
            this.animationService.registerAnimations(v.gameState.animations);
            return this.animationService.pendingAnimations.pipe(
              takeWhile((i) => i > 0, true),
              map((i) => {
                this.gamesService.waiting.next(v.gameState !== undefined && v.gameState.waiting);
                return v.gameState;
              }),
            );
          }),
        );
      }),
    ).subscribe((gameState) => {
      this.gameState = gameState;
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
