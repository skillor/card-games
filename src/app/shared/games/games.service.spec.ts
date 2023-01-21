import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { AnimationService } from '../animation/animation.service';
import { SettingsService } from '../settings/settings.service';

import { GamesService } from './games.service';

describe('GamesService', () => {
  let service: GamesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GamesService,
        AnimationService,
        SettingsService,
        {provide: HttpClient, useValue: jasmine.createSpyObj('HttpClient', ['post', 'get'])}
      ]
    });
    service = TestBed.inject(GamesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
