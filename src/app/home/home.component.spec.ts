import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AnimationService } from 'src/app/shared/animation/animation.service';
import { GameLoaderService } from 'src/app/shared/games/games-loader.service';
import { RoomService } from 'src/app/shared/room/room.service';
import { SettingsService } from 'src/app/shared/settings/settings.service';
import { StorageService } from 'src/app/shared/storage/storage.service';

import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  let routeSpy = jasmine.createSpyObj('ActivatedRoute', {}, {
    paramMap: of({ get: () => undefined, }),
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HomeComponent ],
      providers: [
        RoomService,
        GameLoaderService,
        AnimationService,
        SettingsService,
        StorageService,
        {provide: ActivatedRoute, useValue: routeSpy},
        {provide: HttpClient, useValue: jasmine.createSpyObj('HttpClient', ['post', 'get'])},
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
