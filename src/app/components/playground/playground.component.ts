import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { skipWhile, Subscription, switchMap } from 'rxjs';
import { GameOption } from 'src/app/shared/games/game-option';
import { GameState } from 'src/app/shared/games/game-state';
import { GamesService } from 'src/app/shared/games/games.service';

@Component({
  selector: 'app-playground',
  templateUrl: './playground.component.html',
  styleUrls: ['./playground.component.scss']
})
export class PlaygroundComponent implements OnInit, OnDestroy {

  @Input()
  gameState?: GameState;

  textOptions: GameOption[] = [];
  subscription?: Subscription;

  constructor(
    private gamesService: GamesService,
  ) { }

  chooseOption(option: GameOption): void {
    this.gamesService.chooseOption.next(option);
  }

  ngOnInit(): void {
    this.subscription = this.gamesService.waiting.pipe(
      skipWhile((waiting) => {
        if (waiting) return false;
        this.textOptions = [];
        return true;
      }),
      switchMap(() => this.gamesService.currentOptions),
    ).subscribe((options) => {
      this.textOptions = [];
      if (!options) return;
      for (let option of options) {
        if (option.text) this.textOptions.push(option);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
