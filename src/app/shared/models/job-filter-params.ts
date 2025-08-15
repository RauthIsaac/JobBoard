export interface JobFilterParams {
  searchValue?: string;
  categoryId?: number;
  skillId?: number;
  employerId?: number;
  workplaceType?: string;
  jobType?: string;
  experienceLevel?: string;
  educationLevel?: string;
  isActive?: boolean;
  sortingOption?: SortingOptions;
  location?: string; 
}

export enum SortingOptions {
  DateDesc = 0,
  DateAsc = 1,
  SalaryDesc = 2,
  SalaryAsc = 3
}