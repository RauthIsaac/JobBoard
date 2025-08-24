import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDashboardAnalytics } from './admin-dashboard-analytics';

describe('AppAdminDashboardAnalytics', () => {
  let component: AdminDashboardAnalytics;
  let fixture: ComponentFixture<AdminDashboardAnalytics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashboardAnalytics]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminDashboardAnalytics);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
