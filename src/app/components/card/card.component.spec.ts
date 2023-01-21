import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnimationService } from 'src/app/shared/animation/animation.service';
import { GamesService } from 'src/app/shared/games/games.service';
import { SettingsService } from 'src/app/shared/settings/settings.service';

import { CardComponent } from './card.component';

describe('CardComponent', () => {
  let component: CardComponent;
  let fixture: ComponentFixture<CardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CardComponent ],
      providers: [
        GamesService,
        AnimationService,
        SettingsService,
        {provide: HttpClient, useValue: jasmine.createSpyObj('HttpClient', ['post', 'get'])}
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
