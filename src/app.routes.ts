import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Home } from './app/pages/home/home';
import { TestBuilderPage } from './app/pages/test-builder/test-builder-page';
import { TenantsListPage } from './app/tenants/pages/tenants-list/tenants-list.page';
import { TenantDetailPage } from './app/tenants/pages/tenant-detail/tenant-detail.page';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [
            { path: '', component: Home },
            { path: 'test-builder', component: TestBuilderPage },
            { path: 'tenants', component: TenantsListPage },
            { path: 'tenants/:tenantId', component: TenantDetailPage }
        ]
    },
    { path: '**', redirectTo: '' }
];
