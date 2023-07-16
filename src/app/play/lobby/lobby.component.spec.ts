import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { AnimationService } from 'src/app/shared/animation/animation.service';
import { GameLoaderService } from 'src/app/shared/games/games-loader.service';
import { RoomService } from 'src/app/shared/room/room.service';
import { SettingsService } from 'src/app/shared/settings/settings.service';

import { LobbyComponent } from './lobby.component';

describe('LobbyComponent', () => {
  let component: LobbyComponent;
  let fixture: ComponentFixture<LobbyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LobbyComponent ],
      providers: [
        RoomService,
        GameLoaderService,
        AnimationService,
        SettingsService,
        {provide: HttpClient, useValue: jasmine.createSpyObj('HttpClient', ['post', 'get'])},
        {provide: ActivatedRoute, useValue: jasmine.createSpyObj('ActivatedRoute', ['params'])},
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LobbyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
