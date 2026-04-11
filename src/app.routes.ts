import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Home } from './app/pages/home/home';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [{ path: '', component: Home }]
    },
    { path: '**', redirectTo: '' }
];
