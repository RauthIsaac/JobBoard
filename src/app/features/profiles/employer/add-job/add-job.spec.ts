import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddJob } from './add-job';

describe('AddJob', () => {
  let component: AddJob;
  let fixture: ComponentFixture<AddJob>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddJob]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddJob);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
