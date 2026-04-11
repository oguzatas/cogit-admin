import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Home } from './app/pages/home/home';
import { TestBuilderPage } from './app/pages/test-builder/test-builder-page';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [
            { path: '', component: Home },
            { path: 'test-builder', component: TestBuilderPage }
        ]
    },
    { path: '**', redirectTo: '' }
];
