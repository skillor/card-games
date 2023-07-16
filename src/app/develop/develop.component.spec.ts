import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DevelopComponent } from './develop.component';

describe('DevelopComponent', () => {
  let component: DevelopComponent;
  let fixture: ComponentFixture<DevelopComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DevelopComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DevelopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
