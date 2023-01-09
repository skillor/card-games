import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { RoomService } from './shared/room/room.service';
import { LobbyComponent } from './pages/lobby/lobby.component';
import { StorageService } from './shared/storage/storage.service';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LobbyComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
  ],
  providers: [
    RoomService,
    StorageService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
