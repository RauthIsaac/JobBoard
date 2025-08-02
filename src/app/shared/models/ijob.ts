export interface IJob {
    id : number,
    title : string,
    description : string,
    salary : number,
    workplaceType : WorkplaceType,  
    jobType : JobType,       
    postedDate : Date,
    expireDate : Date,
    requirements : string,
    minTeamSize : number,
    maxTeamSize : number,
    educationLevel : EducationLevel,  
    experienceLevel : ExperienceLevel,
    isActive : boolean,
    companyName : string,
    companyLocation : string,
    website : string,
    categories: string[],
    skills : string[],
}


enum WorkplaceType
{
	OnSite,
	Remote,
	Hybrid
}

enum JobType
{
	FullTime,
	PartTime,
	Freelance,
	Internship,
	Temporary,
	Contract
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

enum ExperienceLevel
{
    Student,
    Internship,
    EntryLevel,
    Experienced,
    TeamLeader,
    Manager,
    Director,
    Executive,
    NotSpecified
}