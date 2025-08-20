import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmpPostedJobs } from './emp-posted-jobs';

describe('EmpPostedJobs', () => {
  let component: EmpPostedJobs;
  let fixture: ComponentFixture<EmpPostedJobs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmpPostedJobs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmpPostedJobs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
