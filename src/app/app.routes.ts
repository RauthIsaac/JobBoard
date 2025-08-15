import { Routes } from '@angular/router';
import { Home } from './features/Home/home/home';
import { NotFound } from './Pages/not-found/not-found';
import { JobDetails } from './features/Jobs/job-details/job-details';
import { JobView } from './features/Jobs/job-view/job-view';
import { SavedJobs } from './features/Jobs/saved-jobs/saved-jobs';
import { EmployerProfile } from './features/profiles/employer/employer-profile/employer-profile';
import { AddJob } from './features/profiles/employer/add-job/add-job';
import { Navbar } from './shared/components/navbar/navbar';
import { Login } from './auth/login/login';
import { Signup } from './auth/signup/signup';
import { ConfirmEmail } from './auth/confirm-email/confirm-email';
import { ForgetPassword } from './auth/forget-password/forget-password';
import { ResetPassword } from './auth/reset-password/reset-password';
import { Explore } from './features/Explore/explore';
import { EditEmpProfile } from './features/profiles/employer/edit-emp-profile/edit-emp-profile';
import { EditSeekerProfile} from './features/profiles/seeker/edit-seeker-profile/edit-seeker-profile';
import { SeekerProfile } from './features/profiles/seeker/seeker-profile/seeker-profile';
import { Layout } from './features/Application/seeker-application/layout/layout';
import { PersonalInfo } from './features/Application/seeker-application/steps/personal-info/personal-info';
import { Documents } from './features/Application/seeker-application/steps/documents/documents';
import { Questions } from './features/Application/seeker-application/steps/questions/questions';
import { Review } from './features/Application/seeker-application/steps/review/review';




export const routes: Routes = [
    {path: '', redirectTo: 'home', pathMatch: 'full'},
    {
        path: '',
        component: Navbar,
        children: [
            {path: 'home', component: Home},
            {path: 'jobDtl/:id', component: JobDetails},
            {path: 'jobView', component: JobView},
            {path: 'savedJobs', component: SavedJobs},
            {path: 'empProfile', component: EmployerProfile},
            {path: 'explore', component: Explore},
            {path: 'editEmp', component: EditEmpProfile},

            {path: 'savedJobs', component: SavedJobs},
            {path: 'editSeeker', component: EditSeekerProfile},
            {path: 'seekerProfile', component: SeekerProfile},

        ]
    },


    {
        path: 'seekerApp',
        component: Layout,
        children: [
            { path: 'personal-info', component: PersonalInfo },
            { path: 'documents', component: Documents },
            { path: 'questions', component: Questions },
            { path: 'review', component: Review },
            { path: '', redirectTo: 'personal-info', pathMatch: 'full' }
        ]
    },


    {path: 'addJob', component: AddJob},
    {path: 'register', component: Signup },
    {path: 'login', component: Login },
    {path: 'confirm-email', component: ConfirmEmail},
    {path: 'forget-password', component: ForgetPassword},
    {path: 'reset-password', component: ResetPassword},



    {path: '**', component: NotFound}
    
];