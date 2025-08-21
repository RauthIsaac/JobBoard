import { Routes } from '@angular/router';
import { ConfirmEmail } from './auth/confirm-email/confirm-email';
import { ForgetPassword } from './auth/forget-password/forget-password';
import { Login } from './auth/login/login';
import { ResetPassword } from './auth/reset-password/reset-password';
import { Signup } from './auth/signup/signup';
import { ChatButton } from './features/AIChat/chat-button/chat-button';
import { ApplicationForm } from './features/Application/application-form/application-form';
import { Layout } from './features/Application/seeker-application/layout/layout';
import { Documents } from './features/Application/seeker-application/steps/documents/documents';
import { PersonalInfo } from './features/Application/seeker-application/steps/personal-info/personal-info';
import { Questions } from './features/Application/seeker-application/steps/questions/questions';
import { Review } from './features/Application/seeker-application/steps/review/review';
import { Explore } from './features/Explore/explore';
import { Home } from './features/Home/home/home';
import { AddJob } from './features/Jobs/add-job/add-job';
import { EditJob } from './features/Jobs/edit-job/edit-job';
import { JobDetails } from './features/Jobs/job-details/job-details';
import { JobView } from './features/Jobs/job-view/job-view';
import { SavedJobs } from './features/Jobs/saved-jobs/saved-jobs';
import { NotificationComponent } from './features/Notifications/notification/notification';
import { EditEmpProfile } from './features/profiles/employer/edit-emp-profile/edit-emp-profile';
import { EmployerAnalyticsSection } from './features/profiles/employer/employer-analytics-section/employer-analytics-section';
import { EmployerDashboard } from './features/profiles/employer/employer-dashboard/employer-dashboard';
import { EmployerDashbordSection } from './features/profiles/employer/employer-dashbord-section/employer-dashbord-section';
import { EmployerAnalyticsSection } from './features/profiles/employer/employer-analytics-section/employer-analytics-section';
import { EmpPostedJobs } from './features/Jobs/emp-posted-jobs/emp-posted-jobs';
import { ExternalLogin } from './auth/external-login/external-login';




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

            {path: 'explore', component: Explore},


            {path: 'savedJobs', component: SavedJobs},
            {path: 'editSeeker', component: EditSeekerProfile},
            {path: 'seekerProfile', component: SeekerProfile},

        ]
    },


    {
        path: 'seekerApp/:jobId',
        component: Layout,
        children: [
            { path: 'personal-info', component: PersonalInfo },
            { path: 'documents', component: Documents },
            { path: 'questions', component: Questions },
            { path: 'review', component: Review },
            { path: '', redirectTo: 'personal-info', pathMatch: 'full' }
        ]
    },

    {
        path: '',
        component: EmployerDashboard,
        children: [
            {path: 'empDashboard', component: EmployerDashbordSection},
            {path: 'empProfile', component: EmployerProfileSection},
            {path: 'empAnalytics', component: EmployerAnalyticsSection},

            
            { path: '', redirectTo: 'empDashboard', pathMatch: 'full' }
        ]
    },

    // {
    //     path:'',
    //     component: NavbarEmp,
    //     children:[
    //         {path: 'empPostedJobs', component: EmpPostedJobs},
    //         {path: 'editEmp', component: EditEmpProfile},
    //         {path: 'addJob', component: AddJob},
    //         {path: 'editJob/:id', component: EditJob},
    //     ]
    // },

            {path: 'empPostedJobs', component: EmpPostedJobs},
            {path: 'editEmp', component: EditEmpProfile},
            {path: 'addJob', component: AddJob},
            {path: 'editJob/:id', component: EditJob},
    




    {path: 'register', component: Signup },
    {path: 'login', component: Login },
    {path: 'confirm-email', component: ConfirmEmail},
    {path: 'forget-password', component: ForgetPassword},
    {path: 'reset-password', component: ResetPassword},


    {path: 'chatBtn', component: ChatButton},
    {path: 'appForm', component: ApplicationForm},
    {path: 'notification', component: NotificationComponent},


        
    {path:'externalLogin', component:ExternalLogin},

    {path: '**', component: NotFound}
    
];