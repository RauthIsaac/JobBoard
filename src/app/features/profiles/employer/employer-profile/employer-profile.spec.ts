import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployerProfile } from './employer-profile';

describe('EmployerProfile', () => {
  let component: EmployerProfile;
  let fixture: ComponentFixture<EmployerProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployerProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployerProfile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
