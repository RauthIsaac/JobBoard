import { Routes } from '@angular/router';
import { Home } from './features/Home/home/home';
import { NotFound } from './Pages/not-found/not-found';
import { Login } from './auth/login/login';
import { Signup } from './auth/signup/signup';
import { MainLayout } from './layouts/main-layout';
import { AuthLayout } from './layouts/auth-layout';
import { SeekerProfileComponent } from './features/profiles/seeker/seeker-profile/seeker-profile';
import { ConfirmEmail } from './auth/confirm-email/confirm-email';


export const routes: Routes = [
    {path: '', component: MainLayout, children: [
        {path: '', redirectTo: 'home', pathMatch: 'full'},
        {path: 'home', component:Home},
        { path: 'profile', component: SeekerProfileComponent },
        

    ]},
    {path: '', component: AuthLayout, children: [
        {path: 'register', component: Signup },
        {path: 'login', component: Login },
        {path: 'confirm-email', component: ConfirmEmail},
    ]}

];
