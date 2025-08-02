import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobView } from './job-view';

describe('JobView', () => {
  let component: JobView;
  let fixture: ComponentFixture<JobView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
