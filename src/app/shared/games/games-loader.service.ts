import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom, from, Observable, of, switchMap } from 'rxjs';
import { GameType } from './game-type';
import { GameLogicHead } from './game-logic';
import { ZipArchive, ZipEntry } from '@shortercode/webzip/index.js';
import { ActionBoard } from 'src/app/develop/actions/action-board';
import { CardType } from './card-type';


@Injectable()
export class GameLoaderService {
  allGamesLoaded = false;
  loadedGame: BehaviorSubject<ZipArchive | null> = new BehaviorSubject<ZipArchive | null>(null);
  assetCache: {[p: string]: string} = {};

  constructor(
    private http: HttpClient,
  ) { }

  getGameLogicHead(): Observable<GameLogicHead> {
    return this.http.get<GameLogicHead>('assets/game-logic.json');
  }

  async getLoadedGame(): Promise<ZipArchive> {
    const loadedGame = await firstValueFrom(this.loadedGame);
    if (loadedGame === null) return new Promise((_, rej) => rej('no game loaded'));
    return loadedGame;
  }

  async getRawGameInfo(): Promise<string> {
    return await (await this.getLoadedGame()).get('info.json')!.get_string();
  }

  async getGameType(): Promise<GameType> {
    const g: GameType = JSON.parse(await this.getRawGameInfo());
    g.cards = await this.getCards();
    g.defaultCard = {
      id: 'default',
      name: 'DEFAULT',
      types: {},
      frontImage: await this.findFile(`cards/front`),
      backImage: await this.findFile(`cards/back`),
    };
    g.gameActions = await this.getGameActions();
    return g;
  }

  async getGameActionMaps(): Promise<{ [key: string]: ActionBoard }> {
    return JSON.parse(await (await this.getLoadedGame()).get('actions/map.json')!.get_string());
  }

  async getGameActions(): Promise<{ [key: string]: string }> {
    const actions: { [key: string]: string } = {};
    for (let file of [...<any>(await this.getLoadedGame()).files()]) {
      if (file[0].startsWith('actions/') && file[0].endsWith('.js')) {
        actions[file[0].substring(8, file[0].length - 3)] = await file[1].get_string();
      }
    }
    return actions;
  }

  async getCards(): Promise<{ [key: string]: CardType }> {
    const cards: { [key: string]: CardType } = {};
    for (let file of await this.findFiles(f => f.startsWith('cards/') && f.endsWith('/info.json'))) {
      if (file == 'cards/info.json') continue
      const id = file.substring(6, file.length - 10);
      cards[id] = JSON.parse(await (await this.getFile(file))!.get_string());
      cards[id].id = id;
      if (id) cards[id].frontImage = await this.findFile(`cards/${id}/front`);
      if (!cards[id].frontImage) cards[id].frontImage = await this.findFile(`cards/front`);
      if (id) cards[id].backImage = await this.findFile(`cards/${id}/back`);
      if (!cards[id].backImage) cards[id].backImage = await this.findFile(`cards/back`);
    }
    return cards;
  }

  static mimeTypes: {[key: string]: string} = {
    'svg': 'image/svg+xml',
  }

  fixBlob(path: string, b: Blob): Blob {
    if (b.type != '') return b;
    return new Blob([b], { type: GameLoaderService.mimeTypes[path.split('.').at(-1)!] });
  }

  async getAsset(path: string): Promise<string> {
    if (!path) return '';
    if (path in this.assetCache) return this.assetCache[path];
    const file = await this.getFile(path);
    if (!file) return '';
    const blob = this.fixBlob(path, await file.get_blob());
    const url = URL.createObjectURL(blob);
    this.assetCache[path] = url;
    return url;
  }

  async getFile(path: string): Promise<ZipEntry | undefined> {
    return (await this.getLoadedGame()).get(path);
  }

  async setFile(path: string, data: Blob): Promise<string> {
    const g = await this.getLoadedGame();
    await g.set(path, data);
    const url = URL.createObjectURL(data);
    this.assetCache[path] = url;
    return url;
  }

  async moveFile(from: string, to: string): Promise<void> {
    const g = await this.getLoadedGame();
    await g.move(from, to);
    await g.delete(from);
  }

  async moveFolder(from: string, to: string): Promise<void> {
    if (from != '' && from.at(-1) != '/') throw new Error(`"${from}" is not a valid folder`);
    if (to != '' && to.at(-1) != '/') throw new Error(`"${to}" is not a valid folder`);
    const files = await this.findFiles(f => f.startsWith(from));
    for (let f of files) {
      await this.moveFile(f, `${to}${f.substring(from.length)}`);
    }
  }

  async removeFile(path: string): Promise<void> {
    const g = await this.getLoadedGame();
    await g.delete(path);
  }

  async removeFolder(path: string): Promise<void> {
    if (path != '' && path.at(-1) != '/') throw new Error(`"${path}" is not a valid folder`);
    const files = await this.findFiles(f => f.startsWith(path));
    for (let f of files) {
      await this.removeFile(f);
    }
  }

  clearAssetCache() {
    this.assetCache = {};
  }

  async findFiles(filter: (x: string) => boolean): Promise<string[]> {
    const g = await this.getLoadedGame();
    return [...<any>g.files()].map(f => f[0]).filter(f => !g.is_folder(f) && filter(f));
  }

  async findFile(prefix: string = '', suffix: string = ''): Promise<string> {
    const files = await this.findFiles(f => f.startsWith(prefix) && f.endsWith(suffix));
    if (files.length == 1) return files[0];
    if (files.length == 0) return '';
    throw new Error(`multiple files with prefix "${prefix}" ans suffix "${suffix}": ${files.join(',')}`)
  }

  async getGameAssets(): Promise<string[]> {
    return this.findFiles(f => f.startsWith('assets/'));
  }

  newGame(): void {
    this.clearAssetCache();
    this.loadedGame.next(new ZipArchive());
  }

  loadGameZip(id: string): Observable<{ result?: ZipArchive, progress: number }> {
    return this.http.get(`assets/games/${id}.zip`, { reportProgress: true, responseType: 'blob', observe: 'events' }).pipe(
      switchMap((event) => {
        if (event.type === HttpEventType.DownloadProgress) {
          if (event.total) return of({ finished: false, progress: event.loaded / event.total });
          return of({ result: undefined, progress: event.loaded });
        }
        if (event.type === HttpEventType.Response) {
          if (!event.body) throw new Error('');
          return this.loadGameBlob(event.body);
        }
        return of({ result: undefined, progress: 0 });
      }),
    );
  }

  loadGameBlob(blob: Blob): Observable<{ result?: ZipArchive, progress: number }> {
    return from(ZipArchive.from_blob(blob)).pipe(
      switchMap((result) => {
        this.clearAssetCache();
        this.loadedGame.next(result);
        return of({ result, progress: 1 });
      }),
    );
  }

  getGames(): Observable<{ [key: string]: string }> {
    return this.http.get<{ [key: string]: string }>('assets/games/games.json');
  }
}
