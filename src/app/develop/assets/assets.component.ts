import { Component, OnInit } from '@angular/core';
import { DevelopService } from '../develop.service';

@Component({
  selector: 'app-assets',
  templateUrl: './assets.component.html',
  styleUrls: ['./assets.component.scss'],
  host: { 'class': 'flex w-full' },
})
export class AssetsComponent implements OnInit {
  moveAssetPathFrom?: string;
  moveAssetPathTo = '';

  constructor(
    public developService: DevelopService
  ) { }

  ngOnInit(): void {
  }

  confirmMoveAsset(asset: string) {
    this.moveAssetPathFrom = asset;
    this.moveAssetPathTo = asset;
  }

  async moveAsset(from: string, to: string) {
    if (!(await this.developService.moveAsset(from, to))) return;
    this.moveAssetPathFrom = undefined;
  }
}
