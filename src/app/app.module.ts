import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { RoomService } from './shared/room/room.service';
import { StorageService } from './shared/storage/storage.service';
import { GameLoaderService } from './shared/games/games-loader.service';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SettingsService } from './shared/settings/settings.service';
import { FileService } from './shared/file/file.service';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
  ],
  providers: [
    RoomService,
    StorageService,
    GameLoaderService,
    SettingsService,
    FileService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
