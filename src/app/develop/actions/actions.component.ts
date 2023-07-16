import { Component, OnDestroy, OnInit } from '@angular/core';
import { NodeMap } from 'flume/dist/types';
import { NodeEditor } from 'flume';
import { DevelopService } from '../develop.service';
import { Subject, interval, takeUntil } from 'rxjs';


@Component({
  selector: 'app-actions',
  templateUrl: './actions.component.html',
  styleUrls: ['./actions.component.scss'],
  host: { 'class': 'flex w-full' },
})
export class ActionsComponent implements OnInit, OnDestroy {
  NodeEditor = NodeEditor;

  private ngUnsubscribe = new Subject<void>();

  activeNodes?: NodeMap;

  inactiveActions: string[] = [];

  addActionName?: string;
  changeActiveName?: string;

  deletingAction = false;

  constructor(
    public developService: DevelopService,
  ) {
  }

  setDisplayType(type: string) {
    if (this.developService.actionDisplayType == type) return;
    this.developService.saveActiveAction();
    if (type == 'text') this.developService.compileNodeMap();
    else if (type == 'graph') this.developService.setActionBoard();
    this.developService.actionDisplayType = type;
  }

  addAction(): void {
    if (!this.addActionName) return;
    if (this.addActionName in this.developService.gameActionMaps) return;
    this.developService.gameActionMaps[this.addActionName] = { nodes: {}, comments: {} };
    this.changeAction(this.addActionName);
    this.addActionName = undefined;
  }

  changeAction(actionName: string) {
    this.developService.saveActiveAction();
    this.developService.activeAction = actionName;
    this.inactiveActions = Object.keys(this.developService.gameActionMaps).filter(x => x != this.developService.activeAction).sort();
    this.developService.setActionBoard();
  }

  async changeActionName() {
    if (!this.changeActiveName) return;
    if (this.changeActiveName in this.developService.gameActionMaps) return;
    this.developService.gameActionMaps[this.changeActiveName] = this.developService.gameActionMaps[this.developService.activeAction];
    await this.developService.deleteActiveAction();
    this.developService.activeAction = this.changeActiveName;
    this.changeActiveName = undefined;
  }

  async deleteAction() {
    await this.developService.deleteActiveAction();
    this.deletingAction = false;
    this.pickAction();
  }

  pickAction() {
    const keys = Object.keys(this.developService.gameActionMaps);
    this.developService.activeAction = '';
    if (keys.length > 0) return this.changeAction(keys[0]);
  }

  ngOnInit(): void {
    if (this.developService.gameType) this.pickAction();
    this.developService.gameChange.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.pickAction();
    });
    interval(2000).pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.developService.saveActiveAction();
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
