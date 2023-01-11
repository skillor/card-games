import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Card } from 'src/app/shared/games/card';
import { GamesService } from 'src/app/shared/games/games.service';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent implements OnInit, OnChanges {

  @Input()
  card?: Card;

  @Input()
  back = false;

  src?: string;
  useFallback = false;

  constructor(
    private gamesService: GamesService,
  ) { }

  ngOnInit(): void {
  }

  ngOnChanges(change: SimpleChanges): void {
    if (this.card === undefined) {
      this.src = undefined;
      this.useFallback = false;
      return;
    }
    this.src = this.getImage();
  }

  getImage(): string {
    if (this.useFallback) {
      if (this.back)
        return this.gamesService.getDefaultCardBackImage(this.card!);
      return this.gamesService.getDefaultCardFrontImage(this.card!);
    }
    if (this.back)
      return this.gamesService.getCardBackImage(this.card!);
    return this.gamesService.getCardFrontImage(this.card!);
  }

  onError(e: Event): void {
    if (this.useFallback) return;
    this.useFallback = true;
    this.src = this.getImage();
  }
}
