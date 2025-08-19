import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppViewSeeker } from './app-view-seeker';

describe('AppViewSeeker', () => {
  let component: AppViewSeeker;
  let fixture: ComponentFixture<AppViewSeeker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppViewSeeker]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppViewSeeker);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
