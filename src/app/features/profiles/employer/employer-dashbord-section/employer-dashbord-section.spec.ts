import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployerDashbordSection } from './employer-dashbord-section';

describe('EmployerDashbordSection', () => {
  let component: EmployerDashbordSection;
  let fixture: ComponentFixture<EmployerDashbordSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployerDashbordSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployerDashbordSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
