import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AnimationService } from 'src/app/shared/animation/animation.service';
import { GamesService } from 'src/app/shared/games/games.service';
import { RoomService } from 'src/app/shared/room/room.service';
import { SettingsService } from 'src/app/shared/settings/settings.service';

import { PlayComponent } from './play.component';

describe('PlayComponent', () => {
  let component: PlayComponent;
  let fixture: ComponentFixture<PlayComponent>;

  let routeSpy = jasmine.createSpyObj('ActivatedRoute', ['paramMap']);
  routeSpy.paramMap.and.returnValue(of({ get: () => undefined, }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlayComponent ],
      providers: [
        AnimationService,
        GamesService,
        SettingsService,
        RoomService,
        {provide: HttpClient, useValue: jasmine.createSpyObj('HttpClient', ['post', 'get'])},
        {provide: ActivatedRoute, useValue: routeSpy},
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
