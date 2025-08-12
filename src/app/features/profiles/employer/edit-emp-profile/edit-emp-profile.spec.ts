import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditEmpProfile } from './edit-emp-profile';

describe('EditEmpProfile', () => {
  let component: EditEmpProfile;
  let fixture: ComponentFixture<EditEmpProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditEmpProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditEmpProfile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
