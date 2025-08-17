import { TestBed } from '@angular/core/testing';

import { JobSeeker } from './job-seeker';

describe('JobSeeker', () => {
  let service: JobSeeker;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JobSeeker);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
