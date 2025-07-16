import { Routes } from '@angular/router';
import { Home } from './Pages/blank-layout/home/home';
import { About } from './Pages/blank-layout/about/about';
import { NotFound } from './Pages/not-found/not-found';
import { Contact } from './Pages/blank-layout/contact/contact';

export const routes: Routes = [
    {path: '', redirectTo: 'home', pathMatch: 'full'},
    {path: 'home', component:Home},
    {path: 'about', component:About},
    {path: 'contact', component:Contact},
    // {path: '', component:},


    {path: '**', component:NotFound},

];
