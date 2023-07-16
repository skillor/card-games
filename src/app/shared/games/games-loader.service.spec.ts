import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { SettingsService } from '../settings/settings.service';

import { GameLoaderService } from './games-loader.service';

describe('GamesService', () => {
  let service: GameLoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GameLoaderService,
        SettingsService,
        {provide: HttpClient, useValue: jasmine.createSpyObj('HttpClient', ['post', 'get'])}
      ]
    });
    service = TestBed.inject(GameLoaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
