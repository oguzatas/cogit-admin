import { Component } from '@angular/core';

@Component({
    selector: 'app-home',
    standalone: true,
    template: `
        <div class="card">
            <div class="font-semibold text-xl mb-4">Welcome</div>
            <p class="m-0 text-color-secondary">Your app shell is ready. Add routes under <code>app.routes.ts</code> and feature modules under <code>src/app</code>.</p>
            <p class="mt-3 mb-0 text-color-secondary text-sm">Add routes under <code>app.routes.ts</code> and feature modules under <code>src/app</code>.</p>
        </div>
    `
})
export class Home {}
