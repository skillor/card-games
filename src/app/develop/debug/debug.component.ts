import { Component, OnInit } from '@angular/core';
import { Game } from 'src/app/shared/games/game';
import { DevelopService } from '../develop.service';
import { Controller } from 'src/app/shared/games/controller';
import { GameLogic } from 'src/app/shared/games/game-logic';
import { Card } from 'src/app/shared/games/card';
import { CardStack } from 'src/app/shared/games/card-stack';

@Component({
  selector: 'app-debug',
  templateUrl: './debug.component.html',
  styleUrls: ['./debug.component.scss']
})
export class DebugComponent implements OnInit {

  constructor(
    private developService: DevelopService
  ) { }

  ngOnInit(): void {
  }

  async start() {
    const g = new Game(this.developService.gameType);
    g.controllers = {
      '1': new Controller(),
      '2': new Controller(),
    };
    g.createGameState(['1', '2']);
    const orignalLogic: any = new (class G extends GameLogic {
      // override async moveCards(from: Promise<CardStack>, to: Promise<CardStack>, fromCards?: Promise<Card[]> | undefined): Promise<any> {
      //   // console.log(await from, await to, await fromCards);
      //   await super.moveCards(from, to, fromCards);
      // }
    })(g);
    const logic: any = new GameLogic(g);
    const funtionNames = Object.getOwnPropertyNames(Object.getPrototypeOf(logic)).filter((x) => x != 'constructor');
    for (let f of funtionNames) {
      if (f == 'of') continue;
      logic[f] = (...args: any[]) => {
        const r = orignalLogic[f](...args);
        return r.switch((...args: any) => {console.log(f, ...args); return r;});
      };
    }
    // console.log(funtionNames[0], logic[funtionNames[0]]);
    // const func = Function(...funtionNames, "rv", 'rv[0]=' + f);
    // func(...funtionNames.map((n) => (<any>this.gameLogic)[n].bind(this.gameLogic)), rv);
    g.gameLogic = logic;
    console.log(await g.nextPhase());
  }
}
