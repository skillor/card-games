import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { combineLatest, map, Observable, of, switchMap } from 'rxjs';
import { Game } from './game';

@Injectable()
export class GamesService {
  games?: {[key: string]: Game};

  constructor(private http: HttpClient) {}

  getGames(): Observable<{[key: string]: Game}> {
    if (this.games !== undefined) return of(this.games);
    return this.http.get<{games: string[]}>('assets/games/games.json').pipe(
      switchMap((data) => {
        return combineLatest(data.games.map((name) => this.http.get<Game>('assets/games/' + name + '/info.json').pipe(
          map((game) => { return {name: name, game: game}; }),
        ))).pipe(
          map(games => {
            this.games = games.reduce((a, game) => ({ ...a, [game.name]: game.game}), {});
            return this.games;
          })
        );
      }),
    );
  }
}
