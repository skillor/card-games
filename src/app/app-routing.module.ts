import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { environment } from 'src/environments/environment';
import { CreateGameComponent } from './pages/create-game/create-game.component';
import { DebugComponent } from './pages/debug/debug.component';
import { HomeComponent } from './pages/home/home.component';
import { LobbyComponent } from './pages/lobby/lobby.component';
import { PlayComponent } from './pages/play/play.component';

const routes: Routes = [
  {component: HomeComponent, path: 'home'},
  {component: HomeComponent, path: 'join/:id'},
  {component: LobbyComponent, path: 'lobby/:id'},
  {component: PlayComponent, path: 'play/:game'},
  {component: PlayComponent, path: 'play/:game/:id'},
  {component: DebugComponent, path: 'debug/:game'},
  {component: CreateGameComponent, path: 'create-game'},
  {path: '**', redirectTo: '/home'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: environment.routerUseHash})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
