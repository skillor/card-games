import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, combineLatest, concatMap, filter, first, map, Observable, of, Subject, switchMap, takeWhile, tap } from 'rxjs';
import { GameAction, GameType } from './game-type';
import { CardType } from './card-type';
import { Game } from './game';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { GameOption } from './game-option';
import { GameState } from './game-state';
import { AnimationService } from '../animation/animation.service';

@Injectable()
export class GamesService {
  allGamesLoaded = false;
  games: {[key: string]: GameType} = {};

  constructor(
    private http: HttpClient,
    private animationService: AnimationService,
    private sanitizer: DomSanitizer,
    ) {}

  getGamePath(gameId: string): string {
    return 'assets/games/' + gameId;
  }

  getGameResource(gameId: string, resource: string): string {
    return this.getGamePath(gameId) + '/' + resource;
  }

  getCardTypePath(gameId: string, cardTypeId: string) {
    return this.getGameResource(gameId, 'cards/' + cardTypeId);
  }

  getCardBackImage(cardType: CardType): SafeUrl {
    if (cardType.backImage !== undefined) return this.sanitizer.bypassSecurityTrustResourceUrl(cardType.backImage);
    return this.getGameResource(cardType.gameId!, 'cards/back.svg');
  }

  getCardFrontImage(cardType: CardType): SafeUrl {
    if (cardType.frontImage !== undefined) return this.sanitizer.bypassSecurityTrustResourceUrl(cardType.frontImage);
    return this.getCardTypePath(cardType.gameId!, cardType.id!) + '/front.svg';
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

  loadImage(src: string, cardType: CardType): Observable<Blob> {
    return this.http.get(src, {responseType: 'blob'}).pipe(
      map((response: Blob) => {
        return response;
      })
    );
  }

  loadCardImages(game: GameType): Observable<GameType> {
    let obs: Observable<GameType>;
    if (game.cards === undefined) obs = this.loadCardTypes(game);
    else obs = of(game);
    return obs.pipe(
      switchMap((game) => {
        return combineLatest(Object.values(game.cards!).map((cardType) => this.loadImage(this.getCardFrontImage(cardType).toString(), cardType).pipe(
          map((blob: Blob) => {
            cardType.frontImage = URL.createObjectURL(blob);
            return cardType;
          })
        )).concat(Object.values(game.cards!).map((cardType) => this.loadImage(this.getCardBackImage(cardType).toString(), cardType).pipe(
          map((blob: Blob) => {
            cardType.backImage = URL.createObjectURL(blob);
            return cardType;
          })
        )))).pipe(
          map(() => {
            return game;
          }));
      })
    );
  }

  loadGameAction(gameId: string, gameAction: GameAction): Observable<GameAction> {
    if (gameAction.action !== undefined) return of(gameAction);
    if (gameAction.actionFile === undefined) throw new Error('neither action nor action file defined');
    return this.http.get(this.getGameResource(gameId, gameAction.actionFile), {responseType: 'text'}).pipe(
      map((text) => {
        gameAction.action = text.replace(/\s/g,'');
        return gameAction;
      })
    );
  }

  loadGameActions(game: GameType): Observable<GameType> {
    return of(game).pipe(switchMap((game) => {
      return combineLatest(Object.values(game.gameActions).map((gameAction) => this.loadGameAction(game.id!, gameAction))).pipe(map(() => game));
    }));
  }

  loadFullGame(game: GameType): Observable<GameType> {
    return this.loadCardImages(game).pipe(switchMap((game) => this.loadGameActions(game)));
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

  gameState = new BehaviorSubject<GameState | undefined>(undefined)

  autoPlay(game: Game): Observable<GameState> {
    this.animationService.clearAnimations();
    this.animationService.registerAnimations(game.gameState!.animations);
    this.gameState.next(game.gameState);
    return game.nextStates().pipe(
      map((v) => {this.gameState.next(v); return v;}),
      concatMap(() => this.gameState.pipe(
        map((v) => v!),
        concatMap((v) => {
          this.animationService.registerAnimations(v.animations);
          return this.animationService.pendingAnimations.pipe(
            takeWhile((i) => i > 0, true),
            map((i) => {
              return v;
            }),
          );
        }),
      )),
      takeWhile((v) => !v.ended, true),
    );
  }

  currentOptions = new BehaviorSubject<GameOption[] | undefined>(undefined);
  chooseOption = new Subject<GameOption>();

  waitForOption(options: GameOption[]): Observable<GameOption> {
    this.currentOptions.next(options);
    return this.chooseOption.pipe(
      first(),
      map((v) => {this.currentOptions.next(undefined); return v;}),
    );
  }
}
