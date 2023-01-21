import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AnimationService } from 'src/app/shared/animation/animation.service';
import { GamesService } from 'src/app/shared/games/games.service';
import { SettingsService } from 'src/app/shared/settings/settings.service';

import { DebugComponent } from './debug.component';

describe('DebugComponent', () => {
  let component: DebugComponent;
  let fixture: ComponentFixture<DebugComponent>;

  let routeSpy = jasmine.createSpyObj('ActivatedRoute', {}, {
    paramMap: of({ get: () => undefined, }),
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DebugComponent ],
      providers: [
        GamesService,
        AnimationService,
        SettingsService,
        {provide: HttpClient, useValue: jasmine.createSpyObj('HttpClient', ['post', 'get'])},
        {provide: ActivatedRoute, useValue: routeSpy},
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DebugComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
