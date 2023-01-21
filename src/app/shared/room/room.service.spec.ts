import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { AnimationService } from '../animation/animation.service';
import { GamesService } from '../games/games.service';
import { SettingsService } from '../settings/settings.service';

import { RoomService } from './room.service';

describe('RoomService', () => {
  let service: RoomService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RoomService,
        GamesService,
        AnimationService,
        SettingsService,
        {provide: HttpClient, useValue: jasmine.createSpyObj('HttpClient', ['post', 'get'])}
      ]
    });
    service = TestBed.inject(RoomService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
