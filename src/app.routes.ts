import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './app/core/auth/auth.guard';
import { AppLayout } from './app/layout/component/app.layout';
import { GuestLayout } from './app/layout/component/guest.layout';
import { AssessmentInvitePage } from './app/assessment/pages/assessment-invite.page';
import { LoginPage } from './app/pages/auth/login.page';
import { HomePage } from './app/pages/home/home.page';
import { TestBuilderPage } from './app/pages/test-builder/test-builder-page';
import { TestsListPage } from './app/pages/tests/tests-list.page';
import { TenantsListPage } from './app/tenants/pages/tenants-list/tenants-list.page';
import { TenantDetailPage } from './app/tenants/pages/tenant-detail/tenant-detail.page';
import { AssignmentsListPage } from './app/assignments/pages/assignments-list/assignments-list.page';
import { AssignmentDetailPage } from './app/assignments/pages/assignment-detail/assignment-detail.page';
import { TestResultsListPage } from './app/assignments/pages/test-results-list/test-results-list.page';
import { AssignmentReportPage } from './app/assignments/pages/assignment-report/assignment-report.page';

export const appRoutes: Routes = [
    { path: 'login', component: LoginPage, canActivate: [guestGuard] },
    /** Public candidate flow — no admin JWT required */
    {
        path: 'assessment',
        component: GuestLayout,
        children: [{ path: 'invite/:accessKey', component: AssessmentInvitePage }],
    },
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard],
        children: [
            { path: '', component: HomePage },
            { path: 'tests', component: TestsListPage },
            { path: 'tests/new', component: TestBuilderPage },
            { path: 'tests/:testId/edit', component: TestBuilderPage },
            // legacy/demo route (kept for convenience)
            { path: 'test-builder', component: TestBuilderPage },
            { path: 'tenants', component: TenantsListPage },
            { path: 'tenants/:tenantId', component: TenantDetailPage },
            { path: 'assignments/results', component: TestResultsListPage },
            { path: 'assignments/:assignmentId/report', component: AssignmentReportPage },
            { path: 'assignments', component: AssignmentsListPage },
            { path: 'assignments/:assignmentId', component: AssignmentDetailPage }
        ]
    },
    { path: '**', redirectTo: '' }
];
