import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarEmp } from './navbar-emp';

describe('NavbarEmp', () => {
  let component: NavbarEmp;
  let fixture: ComponentFixture<NavbarEmp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarEmp]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarEmp);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
