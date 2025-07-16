import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewApplications } from './view-applications';

describe('ViewApplications', () => {
  let component: ViewApplications;
  let fixture: ComponentFixture<ViewApplications>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewApplications]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewApplications);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
