// iemployer-applications.ts (fixed status to number for type safety)
export interface IemployerApplications {
    id: number;
    applicantName: string;
    jobTitle: string;
    currentPosition: string;
    appliedDate: string;
    experience: string;
    status: number;
    statusDisplay: string;
    resumeUrl: string;
}

export enum ApplicationStatus {
  Pending = 0,
  UnderReview = 1,
  Interviewed = 2,
  Accepted = 3,
  Rejected = 4
}

// Additional interfaces for better type safety
export interface UpdateApplicationStatusDto {
    status: number;
}

export interface ApplicationStatistics {
    total: number;
    new: number;
    thisMonth: number;
    interviews: number;
}