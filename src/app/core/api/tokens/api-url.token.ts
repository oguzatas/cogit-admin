import { InjectionToken } from '@angular/core';

/** Absolute origin for the HTTP API (no trailing slash). Provided in `app.config.ts`. */
export const API_URL = new InjectionToken<string>('API_URL');
