import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobExploreView } from './job-explore-view';

describe('JobExploreView', () => {
  let component: JobExploreView;
  let fixture: ComponentFixture<JobExploreView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobExploreView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobExploreView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
