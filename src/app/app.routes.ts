import { Routes } from '@angular/router';
import { ConfirmEmail } from './auth/confirm-email/confirm-email';
import { ExternalLogin } from './auth/external-login/external-login';
import { ForgetPassword } from './auth/forget-password/forget-password';
import { Login } from './auth/login/login';
import { ResetPassword } from './auth/reset-password/reset-password';
import { Signup } from './auth/signup/signup';
import { ChatButton } from './features/AIChat/chat-button/chat-button';
import { AdminDashboardAnalytics } from './features/app-admin-dashboard/admin-dashboard-analytics/admin-dashboard-analytics';
import { Layout } from './features/Application/seeker-application/layout/layout';
import { Documents } from './features/Application/seeker-application/steps/documents/documents';
import { PersonalInfo } from './features/Application/seeker-application/steps/personal-info/personal-info';
import { Questions } from './features/Application/seeker-application/steps/questions/questions';
import { Review } from './features/Application/seeker-application/steps/review/review';
import { Explore } from './features/Explore/explore';
import { Home } from './features/Home/home/home';
import { AddJob } from './features/Jobs/add-job/add-job';
import { EditJob } from './features/Jobs/edit-job/edit-job';
import { EmpPostedJobs } from './features/Jobs/emp-posted-jobs/emp-posted-jobs';
import { JobDetails } from './features/Jobs/job-details/job-details';
import { JobView } from './features/Jobs/job-view/job-view';
import { SavedJobs } from './features/Jobs/saved-jobs/saved-jobs';
import { NotificationComponent } from './features/Notifications/notification/notification';
import { EditEmpProfile } from './features/profiles/employer/edit-emp-profile/edit-emp-profile';
import { EmployerAnalyticsSection } from './features/profiles/employer/employer-analytics-section/employer-analytics-section';
import { EmployerDashboard } from './features/profiles/employer/employer-dashboard/employer-dashboard';
import { EmployerDashbordSection } from './features/profiles/employer/employer-dashbord-section/employer-dashbord-section';
import { EmployerProfileSection } from './features/profiles/employer/employer-profile-section/employer-profile-section';
import { EditSeekerProfile } from './features/profiles/seeker/edit-seeker-profile/edit-seeker-profile';
import { SeekerProfile } from './features/profiles/seeker/seeker-profile/seeker-profile';
import { NotFound } from './Pages/not-found/not-found';
import { Navbar } from './shared/components/navbar/navbar';
import { AppView } from './features/Application/app-view/app-view';
import { AppViewEmp } from './features/Application/app-view-emp/app-view-emp';
import { AppViewJob } from './features/Application/app-view-job/app-view-job';
import { AuthGuard } from './auth/auth-guard';
import { Unauthorized } from './Pages/unauthorized/unauthorized';
import { AppViewSeeker } from './features/Application/app-view-seeker/app-view-seeker';
import { RoleBasedRedirectGuard } from './auth/role-based-redirect-guard';


export type UserType = 'Admin' | 'Seeker' | 'Employer';


export const routes: Routes = [

    {
        path: '', 
        canActivate: [RoleBasedRedirectGuard],
        component: Home, 
        pathMatch: 'full'
    },

    {
        path:'',
        component: Navbar,
        children: [
            { 
                path: 'home', 
                component: Home,
                canActivate: [AuthGuard],
                data: { 
                    allowedUserTypes: ['Seeker'] as UserType[],
                    allowUnauthenticated: true 
                }
            },
        ]
    },

    {
        path: '',
        component: Navbar,
        canActivate: [AuthGuard],
        data: { allowedUserTypes: ['Seeker'] as UserType[] },
        children: [
            { path: 'savedJobs', component: SavedJobs},
            { path: 'explore', component: Explore},
            { path: 'savedJobs', component: SavedJobs},
            { path: 'editSeeker', component: EditSeekerProfile},
            { path: 'seekerProfile', component: SeekerProfile},
            { path: 'appViewSeeker', component: AppViewSeeker},
        ]
    },

    {
        path: 'seekerApp/:jobId',
        component: Layout,
        canActivate: [AuthGuard],
        data: { allowedUserTypes: ['Seeker'] as UserType[] },
        children: [
            { path: 'personal-info', component: PersonalInfo },
            { path: 'documents', component: Documents },
            { path: 'questions', component: Questions },
            { path: 'review', component: Review },
            { path: 'profile', component: SeekerProfile},
            { path: '', redirectTo: 'personal-info', pathMatch: 'full' },
        ]
    },

    {
        path: '',
        component: EmployerDashboard,
        canActivate: [AuthGuard],
        data: { allowedUserTypes: ['Employer'] as UserType[] },
        children: [
            { path: 'empDashboard', component: EmployerDashbordSection},
            { path: 'empProfile', component: EmployerProfileSection},
            { path: 'empAnalytics', component: EmployerAnalyticsSection},            
            { path: '', redirectTo: 'empDashboard', pathMatch: 'full' }
        ]
    },
    
    {
        path: 'admin',
        component: AdminDashboardAnalytics,
        canActivate: [AuthGuard],
        data: { allowedUserTypes: ['Admin'] as UserType[] }
    },


    
    /*---------------- Emplyer ----------------*/
    {
        path: 'editEmp', 
        component:EditEmpProfile,
        canActivate: [AuthGuard],
        data: { allowedUserTypes: ['Employer'] as UserType[] }
    },

    /*---------------- Applications  ----------------*/
    {path: 'appView/:id', component: AppView},
    {path: 'appViewEmp', component: AppViewEmp},
    {path: 'appViewJob/:id', component: AppViewJob},


    /*---------------- Jobs ----------------*/
    {path: 'jobDtl/:id', component: JobDetails},
    {path: 'jobView', component: JobView},

    {
        path: 'addJob', 
        component: AddJob,
        canActivate: [AuthGuard],
        data: { allowedUserTypes: ['Employer'] as UserType[] }
    },

    {
        path: 'editJob/:id', 
        component: EditJob,
        canActivate: [AuthGuard],
        data: { allowedUserTypes: ['Employer'] as UserType[] }
    },

    {
        path: 'empPostedJobs', 
        component: EmpPostedJobs,
        canActivate: [AuthGuard],
        data: { allowedUserTypes: ['Employer'] as UserType[] }
    },


    /*---------------- Sign Up & Login ----------------*/
    { path: 'register', component: Signup },
    { path: 'login', component: Login },
    { path: 'confirm-email', component: ConfirmEmail},
    { path: 'forget-password', component: ForgetPassword},
    { path: 'reset-password', component: ResetPassword},
    { path: 'externalLogin', component:ExternalLogin},


    /*---------------- AI Chat ----------------*/
    { path: 'chatBtn', component: ChatButton},
    { path: 'notification', component: NotificationComponent},
 
 
     
    { path: 'unauthorized', component: Unauthorized},
    { path: '**', component: NotFound}
    
];