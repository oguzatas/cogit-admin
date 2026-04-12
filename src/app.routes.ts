import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './app/core/auth/auth.guard';
import { AppLayout } from './app/layout/component/app.layout';
import { LoginPage } from './app/pages/auth/login.page';
import { Home } from './app/pages/home/home';
import { TestBuilderPage } from './app/pages/test-builder/test-builder-page';
import { TenantsListPage } from './app/tenants/pages/tenants-list/tenants-list.page';
import { TenantDetailPage } from './app/tenants/pages/tenant-detail/tenant-detail.page';
import { AssignmentsListPage } from './app/assignments/pages/assignments-list/assignments-list.page';
import { AssignmentDetailPage } from './app/assignments/pages/assignment-detail/assignment-detail.page';

export const appRoutes: Routes = [
    { path: 'login', component: LoginPage, canActivate: [guestGuard] },
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard],
        children: [
            { path: '', component: Home },
            { path: 'test-builder', component: TestBuilderPage },
            { path: 'tenants', component: TenantsListPage },
            { path: 'tenants/:tenantId', component: TenantDetailPage },
            { path: 'assignments', component: AssignmentsListPage },
            { path: 'assignments/:assignmentId', component: AssignmentDetailPage }
        ]
    },
    { path: '**', redirectTo: '' }
];
