import { IJob } from "./ijob"

export interface IappDetails {
    id : number,
    fullName :  string,
    email : string,
    phoneNumber : string,
    currentLocation : string,
    currentJobTitle : string,
    yearsOfExperience : string,
    resumeUrl : string,
    coverLetter : string,
    portfolioUrl : string,
    linkedInUrl : string,
    gitHubUrl : string,
    appliedDate : string,
    status : string,
    job : IJob,
    applicantId : number
}
