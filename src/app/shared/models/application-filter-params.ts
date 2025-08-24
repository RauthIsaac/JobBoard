// application-filter-params.ts (removed unused like appliedDateFrom/To, sorting since not supported in backend)
export interface ApplicationFilterParams {
  jobId?: number;
  applicantId?: number;
  status?: number;
  pageIndex?: number;
  pageSize?: number;
}

