export interface Iseeker {
    id : number,
    userId? : string,
    name? : string,
    title? : string,
    dateOfBirth? : Date,
    address? : string,
    cvURL? : string,
    gender? : Gender,
    summary? : string,
    profileImageURL? : string,
    email? : string,
    skillName? : string[],
    seekerExperiences? : SeekerExperience[],
    seekerEducations? : SeekerEducation[],
    certificateName? : string[],
    interestName? : string[],
    trainingName? : string[],
    phoneNumber : string
}

enum Gender {
    Male = 'Male',
    Female = 'Female',
}

interface SeekerExperience{
    id? : number,
    jobTitle? : string,    
    companyName? : string, 
    location? : string,    
    startDate? : Date,
    endDate? : Date,
    description? : string
}

interface SeekerEducation{
    id? : number,
    major? : string,
    faculty? : string,
    university? : string,
    date? : Date,
    location? : string,
    GPA? : number,        
    educationLevel? : EducationLevel
}

enum EducationLevel
{
    HighSchool,
    Bachelor,
    Diploma,
    Master,
    Doctorate,
    NotSpecified
}
