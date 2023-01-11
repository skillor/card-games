import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { RoomService } from './shared/room/room.service';
import { LobbyComponent } from './pages/lobby/lobby.component';
import { StorageService } from './shared/storage/storage.service';
import { PlayComponent } from './pages/play/play.component';
import { GamesService } from './shared/games/games.service';
import { HttpClientModule } from '@angular/common/http';
import { CardComponent } from './components/card/card.component';
import { DebugComponent } from './pages/debug/debug.component';
import { CardStackComponent } from './components/card-stack/card-stack.component';
import { PlaygroundComponent } from './components/playground/playground.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LobbyComponent,
    PlayComponent,
    CardComponent,
    DebugComponent,
    CardStackComponent,
    PlaygroundComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
  ],
  providers: [
    RoomService,
    StorageService,
    GamesService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
