import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppViewJob } from './app-view-job';

describe('AppViewJob', () => {
  let component: AppViewJob;
  let fixture: ComponentFixture<AppViewJob>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppViewJob]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppViewJob);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
