import { Routes } from '@angular/router';
import { Home } from './features/Home/home/home';
import { NotFound } from './Pages/not-found/not-found';


export const routes: Routes = [
    {path: '', redirectTo: 'home', pathMatch: 'full'},
    {path: 'home', component:Home},
    // {path: '', component:},


    {path: '**', component:NotFound},

];
