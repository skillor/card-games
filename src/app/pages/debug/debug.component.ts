import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs';
import { Game } from 'src/app/shared/games/game';
import { GameState } from 'src/app/shared/games/game-state';
import { GamesService } from 'src/app/shared/games/games.service';

@Component({
  selector: 'app-debug',
  templateUrl: './debug.component.html',
  styleUrls: ['./debug.component.scss'],
})
export class DebugComponent implements OnInit {
  game?: Game;
  gameState?: GameState;

  constructor(
    private route: ActivatedRoute,
    private gamesService: GamesService,
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      let gameId = params.get('game');
      if (gameId === null) return;
      this.gamesService.getGameType(gameId).pipe(
        switchMap((gameType) => this.gamesService.createGame(gameType)),
      ).subscribe((game) => {
        this.game = game;
        this.gameState = game.createGameState(['AI1', 'AI2', 'AI3']);
      });
    });
  }

  startGame() {
    this.gameState = this.game!.startGame(this.gameState!);
  }

}
