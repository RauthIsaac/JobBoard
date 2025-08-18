import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppViewEmp } from './app-view-emp';

describe('AppViewEmp', () => {
  let component: AppViewEmp;
  let fixture: ComponentFixture<AppViewEmp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppViewEmp]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppViewEmp);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
