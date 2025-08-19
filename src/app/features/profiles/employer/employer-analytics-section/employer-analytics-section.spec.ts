import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployerAnalyticsSection } from './employer-analytics-section';

describe('EmployerAnalyticsSection', () => {
  let component: EmployerAnalyticsSection;
  let fixture: ComponentFixture<EmployerAnalyticsSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployerAnalyticsSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployerAnalyticsSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
