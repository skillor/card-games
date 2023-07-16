import { Injectable } from '@angular/core';
import { GameType } from '../shared/games/game-type';
import { GameLoaderService } from '../shared/games/games-loader.service';
import { GameLogicHead } from '../shared/games/game-logic';
import { Subject, firstValueFrom } from 'rxjs';
import { NodeMapCreator } from './actions/node-map-creator';
import { createFlumeConfig } from './actions/create-flume-config';
import { createRef } from 'react';
import { NodeResolver } from './actions/node-resolver';
import { ActionBoard } from './actions/action-board';
import { CardType } from '../shared/games/card-type';
import { FileService } from '../shared/file/file.service';

@Injectable()
export class DevelopService {
  errorMsg = '';
  flumeConfig?: any;
  gameChange: Subject<void> = new Subject();
  logicHead?: GameLogicHead;
  gameType!: GameType;

  infoEditorText = '';

  gameActionMaps: { [key: string]: ActionBoard } = {};

  gameCardFrontImages: { [key: string]: string } = {};
  gameCardTypes: { [key: string]: [string, string][] } = {};

  actionDisplayType = 'graph';
  activeAction = '';
  actionEditorText = '';

  activeCardId = '';
  activeCard!: {
    frontImage: string,
    backImage: string,
    cardType: CardType,
  };

  gameAssets: { [key: string]: boolean } = {};

  constructor(
    private gameService: GameLoaderService,
    private fileService: FileService,
  ) {
  }

  async setupLogic() {
    if (this.logicHead == undefined) this.logicHead = await firstValueFrom(this.gameService.getGameLogicHead());
    if (this.flumeConfig == undefined) this.flumeConfig = {
      // ...this.config,
      ...createFlumeConfig(this.logicHead),
      circularBehavior: 'allow',
      defaultNodes: [{
        type: "GameLogic",
      }],
      ref: createRef(),
    };
  }

  async newGame() {
    await this.setupLogic();

    this.gameService.newGame();

    this.gameType = {
      id: 'new-game',
      name: 'New Game',
      defaultCard: {
        id: 'default',
        name: 'DEFAULT',
        types: {},
        frontImage: '',
        backImage: '',
      },
      cards: {},
      globalStacks: {},
      playerStacks: {},
      variables: {},
      startPhase: 'main',
      gamePhases: {'main': {action: 'main'}},
      gameActions: {'main': ''},
    };
    this.infoEditorText = JSON.stringify(this.getInfo(), undefined, 2);

    this.gameActionMaps = {'main': this.decompileAction('')};

    this.gameCardFrontImages = {};
    this.gameCardTypes = {'': []};

    this.gameAssets = {};

    this.changeActiveCard('');

    this.gameChange.next();
  }

  async loadGame() {
    try {
      return await this._loadGame();
    } catch (err) {
      this.errorMsg = String(err);
      throw err;
    }
  }

  saveInfo() {
    try {
      Object.assign(this.gameType, JSON.parse(this.infoEditorText));
    } catch (err: any) {
      err.message = `${err.message} in "info.json"`;
      throw err;
    }
  }

  getInfo(): GameType {
    const t: any = {...this.gameType};
    delete t.cards;
    delete t.defaultCard;
    delete t.gameActions;
    return t;
  }

  private async _loadGame() {
    await this.setupLogic();

    this.gameType = await this.gameService.getGameType();
    this.infoEditorText = await this.gameService.getRawGameInfo();

    try {
      this.gameActionMaps = await this.gameService.getGameActionMaps();
    } catch {
      this.gameActionMaps = {};
    }
    for (let [k, v] of Object.entries(this.gameType.gameActions)) {
      if (!(k in this.gameActionMaps)) {
        try {
          this.gameActionMaps[k] = this.decompileAction(v);
        } catch (err: any) {
          err.message = `${err.message} in "${k}"`;
          throw err;
        }
      }
    }

    this.gameCardFrontImages = Object.fromEntries(await Promise.all(Object.entries(this.gameType.cards).map(async ([id, v]) => ([id, await this.gameService.getAsset(v.frontImage)]))));
    this.gameCardTypes = Object.fromEntries(Object.entries(this.gameType.cards).map(c => [c[0], Object.entries(c[1].types)]));
    this.gameCardTypes[''] = Object.entries(this.gameType.defaultCard.types);

    this.gameAssets = Object.fromEntries((await this.gameService.getGameAssets()).map(a => [a.split('/').slice(1).join('/'), true]));

    this.changeActiveCard('');

    this.gameChange.next();
  }

  saveActiveAction(): void {
    if (!this.activeAction) return;
    if (this.actionDisplayType == 'text') {
      this.mergeBoard(
        this.gameActionMaps[this.activeAction],
        this.decompileAction(this.actionEditorText),
      );
      return;
    }
    this.gameActionMaps[this.activeAction] = this.getActionBoard();
  }

  async deleteActiveAction() {
    await this.gameService.removeFile(this.activeAction);
    delete this.gameActionMaps[this.activeAction];
  }

  getActionBoard(): ActionBoard {
    if (this.flumeConfig.ref.current) return { nodes: this.flumeConfig.ref.current.getNodes(), comments: this.flumeConfig.ref.current.getComments() };
    return this.gameActionMaps[this.activeAction];
  }

  setActionBoard(): void {
    if (!this.activeAction) return;
    this.flumeConfig = { ...this.flumeConfig, nodes: this.gameActionMaps[this.activeAction].nodes, comments: this.gameActionMaps[this.activeAction].comments };
    this.compileNodeMap();
  }

  decompileAction(v: string): ActionBoard {
    return { nodes: (new NodeMapCreator(this.logicHead!, this.flumeConfig)).createNodeMap(v), comments: {} };
  }

  mergeBoard(original: ActionBoard, merge: ActionBoard): ActionBoard {
    original.nodes = merge.nodes;
    return original;
  }

  compileNodeMap() {
    try {
      this.actionEditorText = this._compileNodeMap(this.getActionBoard().nodes);
    } catch (err) {
      this.errorMsg = String(err);
      throw err;
    }
  }

  private _compileNodeMap(nodes: any): string {
    return (new NodeResolver(this.logicHead!)).resolveRootNode(nodes);
  }

  async changeActiveCard(cardId: string) {
    this.activeCardId = cardId;
    const card = cardId == '' ? this.gameType.defaultCard : this.gameType.cards[cardId];
    this.activeCard = {
      frontImage: await this.gameService.getAsset(card.frontImage),
      backImage: await this.gameService.getAsset(card.backImage),
      cardType: card,
    };
  }

  addCard() {
    this.changeActiveCard('');
    this.cloneCard();
  }

  cloneCard() {
    let id = `${this.activeCard.cardType.id}-copy`;
    let i = 0;
    while (id in this.gameType.cards) {
      i++;
      id = `${this.activeCard.cardType.id}-copy${i}`;
    }
    const card = structuredClone(this.activeCard.cardType);
    card.id = id;
    this.gameType.cards[id] = card;
    this.activeCard = { ...this.activeCard, cardType: card };
    this.activeCardId = id;
  }

  deleteCard() {
    if (this.activeCardId == '') return;
    delete this.gameType.cards[this.activeCardId];
    this.changeActiveCard('');
  }

  setFrontImage() {
    this.fileService.loadRawFile('.svg').subscribe(async (file) => {
      const ext = file.name.split('.').at(-1)!;
      let path: string;
      if (this.activeCardId != '') path = `cards/${this.activeCardId}/front.${ext}`;
      else path = `cards/front.${ext}`
      this.activeCard.frontImage = await this.gameService.setFile(path, file);

      if (this.activeCardId != '') this.gameType.cards[this.activeCardId].frontImage = path;
      else {
        for (let c of Object.values(this.gameType.cards)) {
          if (c.frontImage == this.gameType.defaultCard.frontImage) c.frontImage = path;
        }
        this.gameType.defaultCard.frontImage = path;
      }
    });
  }

  setBackImage() {
    this.fileService.loadRawFile('.svg').subscribe(async (file) => {
      const ext = file.name.split('.').at(-1)!;
      let path: string;
      if (this.activeCardId != '') path = `cards/${this.activeCardId}/back.${ext}`;
      else path = `cards/back.${ext}`
      this.activeCard.backImage = await this.gameService.setFile(path, file);

      if (this.activeCardId != '') this.gameType.cards[this.activeCardId].backImage = path;
      else {
        for (let c of Object.values(this.gameType.cards)) {
          if (c.backImage == this.gameType.defaultCard.backImage) c.backImage = path;
        }
        this.gameType.defaultCard.backImage = path;
      }
    });
  }

  async removeFrontImage() {
    URL.revokeObjectURL(this.activeCard.frontImage);

    if (this.gameType.defaultCard.frontImage != '' && (!this.activeCardId || this.gameType.cards[this.activeCardId].frontImage == this.gameType.defaultCard.frontImage)) {
      for (let [k, c] of Object.entries(this.gameType.cards)) {
        if (c.frontImage == this.gameType.defaultCard.frontImage) {
          c.frontImage = '';
          this.gameCardFrontImages[k] = '';
        }
      }
    }

    this.activeCard.frontImage = '';
    if (this.activeCardId != '') {
      await this.gameService.removeFile(this.gameType.cards[this.activeCardId].frontImage);
      this.gameType.cards[this.activeCardId].frontImage = this.gameType.defaultCard.frontImage;
      this.activeCard.frontImage = await this.gameService.getAsset(this.gameType.defaultCard.frontImage);
      this.gameCardFrontImages[this.activeCardId] = this.activeCard.frontImage;
    } else {
      await this.gameService.removeFile(this.gameType.defaultCard.frontImage);
      this.gameType.defaultCard.frontImage = '';
      this.activeCard.frontImage = '';
    }
  }

  async removeBackImage() {
    URL.revokeObjectURL(this.activeCard.backImage);

    if (this.gameType.defaultCard.backImage != '' && (!this.activeCardId || this.gameType.cards[this.activeCardId].backImage == this.gameType.defaultCard.backImage)) {
      for (let c of Object.values(this.gameType.cards)) {
        if (c.backImage == this.gameType.defaultCard.backImage) c.backImage = '';
      }
    }

    if (this.activeCardId != '') {
      await this.gameService.removeFile(this.gameType.cards[this.activeCardId].backImage);
      this.gameType.cards[this.activeCardId].backImage = this.gameType.defaultCard.backImage;
      this.activeCard.backImage = await this.gameService.getAsset(this.gameType.defaultCard.backImage);
    } else {
      await this.gameService.removeFile(this.gameType.defaultCard.backImage);
      this.gameType.defaultCard.backImage = '';
      this.activeCard.backImage = '';
    }
  }

  saveFrontImage() {
    this.fileService.saveFileUrl(`${this.activeCard.cardType.id}-front`, this.activeCard.frontImage);
  }

  saveBackImage() {
    this.fileService.saveFileUrl(`${this.activeCard.cardType.id}-back`, this.activeCard.backImage);
  }

  async downloadAsset(asset: string) {
    this.fileService.saveFileUrl(asset.split('/').at(-1)!, await this.gameService.getAsset(`assets/${asset}`));
  }

  async removeAsset(asset: string) {
    await this.gameService.removeFile(`assets/${asset}`);
    delete this.gameAssets[asset];
  }

  addAsset() {
    this.fileService.loadRawFile('').subscribe(async (file) => {
      const s = file.name.split('.');
      const ext = s.at(-1);
      const name = s.slice(0, -1).join('.');
      let id = `${name}.${ext}`;
      let i = 0;
      while (id in this.gameAssets) {
        i++;
        id = `${name}${i}.${ext}`;
      }
      this.gameAssets[id] = true;
      await this.gameService.setFile(`assets/${id}`, file);
    });
  }

  async moveAsset(from: string, to: string): Promise<boolean> {
    if (from == to) return true;
    if (to in this.gameAssets) return false;
    this.gameService.moveFile(`assets/${from}`, `assets/${to}`);
    delete this.gameAssets[from];
    this.gameAssets[to] = true;
    return true;
  }

  async save() {
    if (this.gameType === undefined) return;
    try {
      await this._save();
    } catch (err) {
      this.errorMsg = String(err);
      throw err;
    }
  }

  private async _save() {
    this.saveInfo();
    await this.gameService.setFile('info.json', new Blob([this.infoEditorText]));

    this.saveActiveAction();

    await this.gameService.setFile('actions/map.json', new Blob([JSON.stringify(this.gameActionMaps)]));
    for (let [k, v] of Object.entries(this.gameActionMaps)) {
      const c = this._compileNodeMap(v.nodes);
      await this.gameService.setFile(`actions/${k}.js`, new Blob([c]));
      this.gameType.gameActions[k] = c;
    }

    await this.gameService.setFile('cards/info.json', new Blob([JSON.stringify({
      id: this.gameType.defaultCard.id,
      name: this.gameType.defaultCard.name,
      types: this.gameType.defaultCard.types,
    }, undefined, 2)]));

    for (let [k, v] of Object.entries(this.gameType.cards)) {
      await this.gameService.setFile(`cards/${k}/info.json`, new Blob([JSON.stringify({
        id: v.id,
        name: v.name,
        types: v.types,
      }, undefined, 2)]));
    }

    await this.gameService.moveFolder('cards/', 'temp/cards/');

    for (let [k, v] of Object.entries(this.gameType.cards)) {
      await this.gameService.moveFolder(`temp/cards/${k}/`, `cards/${v.id}/`);
    }

    await this.gameService.moveFolder('temp/cards/', 'cards/');
  }

  async saveToFile() {
    await this.save();
    this.fileService.saveFileBlob(`${this.gameType.id}.zip`, (await this.gameService.getLoadedGame()).to_blob());
  }

  async saveToLocal() {
    await this.save();
    const reader = new FileReader();

    reader.onload = (event) => {
      localStorage.setItem('temp-zip', <string>event.target!.result);
    }

    reader.readAsDataURL((await this.gameService.getLoadedGame()).to_blob());
  }
}
