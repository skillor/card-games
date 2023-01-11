import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { combineLatest, map, Observable, of, switchMap } from 'rxjs';
import { GameType } from './game-type';
import { CardStack } from './card-stack';
import { CardType } from './card-type';
import { Card } from './card';
import { Game } from './game';

@Injectable()
export class GamesService {
  allGamesLoaded = false;
  games: {[key: string]: GameType} = {};

  constructor(private http: HttpClient) {}

  getGamePath(gameId: string): string {
    return 'assets/games/' + gameId;
  }

  getCardTypePath(gameId: string, cardTypeId: string) {
    return 'assets/games/' + gameId + '/cards/' + cardTypeId;
  }

  getCardBackImage(card: Card): string {
    return this.getCardTypePath(card.cardType.gameId!, card.cardType.id!) + '/back.svg';
  }

  getDefaultCardBackImage(card: Card): string {
    return this.getGamePath(card.cardType.gameId!) + '/cards/back.svg';
  }

  getCardFrontImage(card: Card): string {
    return this.getCardTypePath(card.cardType.gameId!, card.cardType.id!) + '/front.svg';
  }

  getDefaultCardFrontImage(card: Card): string {
    return this.getGamePath(card.cardType.gameId!) + '/cards/front.svg';
  }

  getCardType(gameId: string, id: string): Observable<CardType> {
    return this.http.get<CardType>(this.getCardTypePath(gameId, id) + '/info.json').pipe(
      map((card) => { return {...card, id: id, gameId: gameId}; }),
    );
  }

  loadCardTypes(game: GameType): Observable<GameType> {
    if (game.cards !== undefined) return of(game);
    return this.http.get<string[]>(this.getGamePath(game.id!) + '/cards/cards.json').pipe(
      switchMap((cards) => {
        return combineLatest(cards.map((id) => this.getCardType(game.id!, id))).pipe(
          map(cards => {
            game.cards = cards.reduce((a, card) => ({ ...a, [card.id!]: {...card, id: card.id}}), {});
            return game;
          })
        );
      }),
    );
  }

  loadFullGame(game: GameType): Observable<GameType> {
    return this.loadCardTypes(game);
  }

  getCardTypes(game: GameType): Observable<{[key: string]: CardType}> {
    return this.loadCardTypes(game).pipe(
      map((game) => game.cards!),
    )
  }

  getGameType(id: string): Observable<GameType> {
    if (id in this.games) return of(this.games[id]);
    return this.http.get<GameType>(this.getGamePath(id) + '/info.json').pipe(
      map((game) => {
        game.id = id;
        this.games[id] = game;
        return game;
      }),
    );
  }

  getGameTypes(): Observable<{[key: string]: GameType}> {
    if (this.allGamesLoaded) return of(this.games);
    return this.http.get<string[]>('assets/games/games.json').pipe(
      switchMap((games) => {
        return combineLatest(games.map((id) => this.getGameType(id))).pipe(
          map(() => {
            this.allGamesLoaded = true;
            return this.games;
          })
        );
      }),
    );
  }

  createGame(gameType: GameType): Observable<Game> {
    return this.loadFullGame(gameType).pipe(
      map((gameType) => new Game(gameType))
    )
  }
}
