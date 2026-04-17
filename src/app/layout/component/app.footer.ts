import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `<div class="layout-footer">
        &copy; {{ year }} Scorion
    </div>`,
})
export class AppFooter {
    readonly year = new Date().getFullYear();
}
