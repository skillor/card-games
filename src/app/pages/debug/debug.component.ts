import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { concatMap, map, Subscription, switchMap, takeWhile } from 'rxjs';
import { AnimationService } from 'src/app/shared/animation/animation.service';
import { Game } from 'src/app/shared/games/game';
import { GameState } from 'src/app/shared/games/game-state';
import { GamesService } from 'src/app/shared/games/games.service';
import { HumanController } from 'src/app/shared/games/human-controller';
import { RandomController } from 'src/app/shared/games/random-controller';

@Component({
  selector: 'app-debug',
  templateUrl: './debug.component.html',
  styleUrls: ['./debug.component.scss'],
})
export class DebugComponent implements OnInit {
  game?: Game;
  gameState?: GameState;
  autoPlayer?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private gamesService: GamesService,
    private animationService: AnimationService,
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      let gameId = params.get('game');
      if (gameId === null) return;
      this.gamesService.getGameType(gameId).pipe(
        switchMap((gameType) => this.gamesService.createGame(gameType)),
      ).subscribe((game) => {
        this.game = game;
      });
    });
  }

  isAutoPlaying(): boolean {
    return this.autoPlayer !== undefined && !this.autoPlayer.closed;
  }

  stopAutoPlay() {
    if (this.autoPlayer === undefined) return;
    this.autoPlayer.unsubscribe();
    this.autoPlayer = undefined;
  }

  toggleAutoPlay() {
    if (!this.game) return;
    if (this.isAutoPlaying()) {
      return this.stopAutoPlay();
    }
    this.animationService.clearAnimations();
    this.game.nextGameStates = [];
    this.gameState = this.game.createGameState(['Player', 'AI1', 'AI2']);
    this.game.controllers = {
      'Player': new HumanController(this.gamesService),
      // 'Player': new RandomController(),
      'AI1': new RandomController(),
      'AI2': new RandomController(),
    };
    this.game.setSeed('seed');
    this.animationService.registerAnimations(this.gameState.animations);
    this.gameState = this.game.nextGameStates.pop();
    this.autoPlayer = this.gamesService.autoPlay(this.game).subscribe((v) => {
      this.gameState = v;
    });
  }

  toggleSkipMode() {
    if (this.game === undefined) return;
    this.game.skipMode = !this.game.skipMode;
  }
}
