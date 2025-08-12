import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeekerApplication } from './seeker-application';

describe('SeekerApplication', () => {
  let component: SeekerApplication;
  let fixture: ComponentFixture<SeekerApplication>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeekerApplication]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeekerApplication);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
