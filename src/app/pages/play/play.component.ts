import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Card } from 'src/app/shared/games/card';
import { GamesService } from 'src/app/shared/games/games.service';

@Component({
  selector: 'app-play',
  templateUrl: './play.component.html',
  styleUrls: ['./play.component.scss']
})
export class PlayComponent implements OnInit {

  cards?: Card[];
  constructor(
    private gamesService: GamesService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      let gameId = params.get('game');
      if (gameId === null) return;
      this.gamesService.getGameType(gameId).subscribe((game) => {
        // console.log(game);
        // this.gamesService.getDefaultDeck(game).subscribe((cards) => {
        //   // console.log(cards);
        //   this.cards = cards;
        // });
      });
    });
  }

}
