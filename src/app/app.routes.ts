import { Routes } from '@angular/router';
import { Home } from './features/Home/home/home';
import { NotFound } from './Pages/not-found/not-found';
import { JobDetails } from './features/Jobs/job-details/job-details';
import { JobApplication } from './features/Jobs/job-application/job-application';
import { JobView } from './features/Jobs/job-view/job-view';
import { SavedJobs } from './features/Jobs/saved-jobs/saved-jobs';
import { EmployerProfile } from './features/profiles/employer/employer-profile/employer-profile';
import { AddJob } from './features/profiles/employer/add-job/add-job';
import { Navbar } from './shared/components/navbar/navbar';
import { Login } from './auth/login/login';
import { Signup } from './auth/signup/signup';
import { SeekerProfileComponent } from './features/profiles/seeker/seeker-profile/seeker-profile';
import { ConfirmEmail } from './auth/confirm-email/confirm-email';


export const routes: Routes = [
    {path: '', redirectTo: 'home', pathMatch: 'full'},
    {
        path: '',
        component: Navbar,
        children: [
            {path: 'home', component: Home},
            {path: 'jobDtl/:id', component: JobDetails},
            {path: 'jobView', component: JobView},
            {path: 'savedJobs', component: SavedJobs}
        ]
    },
    
    {path: 'jobApp', component: JobApplication},
    {path: 'empProfile', component: EmployerProfile},
    {path: 'addJob', component: AddJob},
    {path: 'register', component: Signup },
    {path: 'login', component: Login },
    {path: 'confirm-email', component: ConfirmEmail},


    {path: '**', component: NotFound}
    
];

