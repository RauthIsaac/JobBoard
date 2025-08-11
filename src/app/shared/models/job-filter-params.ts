export interface JobFilterParams {
    categoryId?: number;
    skillId?: number;
    employerId?: number;
    workplaceType?: string;
    jobType?: string;
    experienceLevel?: string;
    educationLevel?: string;
    isActive?: boolean;
    sortingOption?: SortingOptions;
    searchValue?: string;
}


export enum SortingOptions {
  DateDesc,
  DateAsc,
  SalaryDesc,
  SalaryAsc
}