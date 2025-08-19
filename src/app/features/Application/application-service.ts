// application-service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {
  
  private applicationData: any = {
    fullName: '',
    email: '',
    phoneNumber: '',
    currentLocation: '',
    currentJobTitle: '',
    yearsOfExperience: '',
    cvFile: null,
    coverLetter: '',
    portfolioUrl: '',
    linkedInUrl: '',
    gitHubUrl: '',
    jobId: 1 // يمكن تمريره من الـ route أو تحديده حسب الحاجة
  };

  setData(part: Partial<typeof this.applicationData>) {
    this.applicationData = { ...this.applicationData, ...part };
  }

  getData() {
    return this.applicationData;
  }

  clearData() {
    this.applicationData = {
      fullName: '',
      email: '',
      phoneNumber: '',
      currentLocation: '',
      currentJobTitle: '',
      yearsOfExperience: '',
      cvFile: null,
      coverLetter: '',
      portfolioUrl: '',
      linkedInUrl: '',
      gitHubUrl: '',
      jobId: 1
    };
  }

  setJobId(jobId: number) {
    this.applicationData.jobId = jobId;
  }
}