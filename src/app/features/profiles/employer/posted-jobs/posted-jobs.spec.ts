import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostedJobs } from './posted-jobs';

describe('PostedJobs', () => {
  let component: PostedJobs;
  let fixture: ComponentFixture<PostedJobs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostedJobs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostedJobs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
