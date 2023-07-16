import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { environment } from 'src/environments/environment';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  {component: HomeComponent, path: 'home'},
  { path: 'play', loadChildren: () => import('./play/play.module').then(m => m.PlayModule) },
  { path: 'develop', loadChildren: () => import('./develop/develop.module').then(m => m.DevelopModule) },
  // {component: HomeComponent, path: 'join/:id'},
  // {component: LobbyComponent, path: 'lobby/:id'},
  // {component: PlayComponent, path: 'play/:game'},
  // {component: PlayComponent, path: 'play/:game/:id'},
  // {component: DebugComponent, path: 'debug/:game'},
  // {component: CreateGameComponent, path: 'create-game'},
  {path: '**', redirectTo: '/home'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: environment.routerUseHash})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
