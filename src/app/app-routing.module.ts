import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LobbyComponent } from './pages/lobby/lobby.component';
import { PlayComponent } from './pages/play/play.component';

const routes: Routes = [
  {component: HomeComponent, path: 'home'},
  {component: HomeComponent, path: 'join/:id'},
  {component: LobbyComponent, path: 'lobby/:id'},
  {component: PlayComponent, path: 'play/:game'},
  {path: '**', redirectTo: '/home'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
