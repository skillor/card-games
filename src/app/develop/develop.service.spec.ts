import { TestBed } from '@angular/core/testing';

import { DevelopService } from './develop.service';

describe('DevelopService', () => {
  let service: DevelopService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DevelopService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
