import { Component } from '@angular/core';

@Component({
    selector: 'app-home',
    standalone: true,
    template: `
        <div class="card">
            <div class="font-semibold text-xl mb-4">Welcome</div>
            <p class="m-0 text-color-secondary">Your app shell is ready. Add routes under <code>app.routes.ts</code> and feature modules under <code>src/app</code>.</p>
            <p class="mt-3 mb-0 text-color-secondary text-sm">Sakai demo pages, UI kit samples, and demo styles live in <code>src/_sakai_vault</code> for reference.</p>
        </div>
    `
})
export class Home {}
