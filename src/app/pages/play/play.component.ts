import { Component, OnInit } from '@angular/core';
import { GamesService } from 'src/app/shared/games/games.service';

@Component({
  selector: 'app-play',
  templateUrl: './play.component.html',
  styleUrls: ['./play.component.scss']
})
export class PlayComponent implements OnInit {

  constructor(
    private gamesService: GamesService
  ) { }

  ngOnInit(): void {
    this.gamesService.getGames().subscribe((games) => console.log(games));
  }

}
