export interface IpostedJob {
    id: number,
    title: string,
    status: string,
    postedDateFormatted: string,
    applicationsCount: number,
    expireDate: Date,
    expireDateFormatted: string,
    industry: string,
    isActive: string,
    isExpiringSoon: string
}    

