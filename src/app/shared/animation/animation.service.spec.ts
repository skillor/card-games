import { TestBed } from '@angular/core/testing';
import { SettingsService } from '../settings/settings.service';

import { AnimationService } from './animation.service';

describe('AnimationService', () => {
  let service: AnimationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AnimationService,
        SettingsService,
      ]
    });
    service = TestBed.inject(AnimationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
