import { Routes } from '@angular/router';
import { Home } from './features/Home/home/home';
import { NotFound } from './Pages/not-found/not-found';
import { JobDetails } from './features/Jobs/job-details/job-details';
import { JobApplication } from './features/Jobs/job-application/job-application';


export const routes: Routes = [
    {path: '', redirectTo: 'home', pathMatch: 'full'},
    {path: 'home', component:Home},
    {path: 'jobDtl', component: JobDetails}, 
    {path: 'jobApp', component: JobApplication},


    {path: '**', component:NotFound}
];
