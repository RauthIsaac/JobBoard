import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobSavedView } from './job-saved-view';

describe('JobSavedView', () => {
  let component: JobSavedView;
  let fixture: ComponentFixture<JobSavedView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobSavedView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobSavedView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
