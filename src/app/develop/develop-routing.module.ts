import { NgModule } from '@angular/core';
import { BaseRouteReuseStrategy, RouterModule, Routes } from '@angular/router';
import { DevelopComponent } from './develop.component';
import { InfoComponent } from './info/info.component';
import {ActivatedRouteSnapshot} from '@angular/router'
import { ActionsComponent } from './actions/actions.component';
import { CardsComponent } from './cards/cards.component';
import { AssetsComponent } from './assets/assets.component';
import { DebugComponent } from './debug/debug.component';

export class CustomRouteReuseStrategy extends BaseRouteReuseStrategy {
  override shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    let name = future.component && (<any>future.component).name;
    return name !== 'InfoComponent'  || super.shouldReuseRoute(future, curr);
  }
}

const routes: Routes = [
    { path: '', component: DevelopComponent, children: [
      { path: 'info', component: InfoComponent },
      { path: 'actions', component: ActionsComponent },
      { path: 'cards', component: CardsComponent },
      { path: 'assets', component: AssetsComponent },
      { path: 'debug', component: DebugComponent },
      { path: '**', redirectTo: 'info' },
    ] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DevelopRoutingModule { }
