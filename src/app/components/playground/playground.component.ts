import { Component, Input, OnInit } from '@angular/core';
import { CardStack } from 'src/app/shared/games/card-stack';
import { GameState } from 'src/app/shared/games/game-state';

@Component({
  selector: 'app-playground',
  templateUrl: './playground.component.html',
  styleUrls: ['./playground.component.scss']
})
export class PlaygroundComponent implements OnInit {

  @Input()
  gameState?: GameState;

  constructor() { }

  ngOnInit(): void {
  }

  getGlobalStacks(): CardStack[] {
    return Object.values(this.gameState!.stacks);
  }
}
