import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnimationService } from 'src/app/shared/animation/animation.service';
import { GamesService } from 'src/app/shared/games/games.service';
import { SettingsService } from 'src/app/shared/settings/settings.service';

import { CardStackComponent } from './card-stack.component';

describe('CardStackComponent', () => {
  let component: CardStackComponent;
  let fixture: ComponentFixture<CardStackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CardStackComponent ],
      providers: [
        GamesService,
        AnimationService,
        SettingsService,
        {provide: HttpClient, useValue: jasmine.createSpyObj('HttpClient', ['post', 'get'])}
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardStackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
