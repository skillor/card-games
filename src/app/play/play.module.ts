import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayRoutingModule } from './play-routing.module';
import { LobbyComponent } from './lobby/lobby.component';



@NgModule({
  declarations: [
    LobbyComponent,
  ],
  imports: [
    CommonModule,
    PlayRoutingModule
  ]
})
export class PlayModule { }
