import { Component, input } from '@angular/core';

export type IconName =
  | 'grid'
  | 'users'
  | 'package'
  | 'clipboard'
  | 'cart'
  | 'wrench'
  | 'plus'
  | 'arrow-right'
  | 'alert-triangle'
  | 'alert-circle'
  | 'trending-up'
  | 'wallet'
  | 'inbox'
  | 'check'
  | 'clock'
  | 'refresh'
  | 'search';

/**
 * Íconos SVG inline del sistema visual. Son decorativos: siempre se ocultan
 * a las tecnologías de asistencia y el texto cercano aporta el significado.
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      @switch (name()) {
        @case ('grid') {
          <rect x="3" y="3" width="7" height="7" rx="2"></rect>
          <rect x="14" y="3" width="7" height="7" rx="2"></rect>
          <rect x="3" y="14" width="7" height="7" rx="2"></rect>
          <rect x="14" y="14" width="7" height="7" rx="2"></rect>
        }
        @case ('users') {
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        }
        @case ('package') {
          <path d="m7.5 4.27 9 5.15"></path>
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
          <path d="M3.3 7 12 12l8.7-5"></path>
          <path d="M12 22V12"></path>
        }
        @case ('clipboard') {
          <path d="M9 5H6.8A1.8 1.8 0 0 0 5 6.8v12.4A1.8 1.8 0 0 0 6.8 21h10.4a1.8 1.8 0 0 0 1.8-1.8V6.8A1.8 1.8 0 0 0 17.2 5H15"></path>
          <rect x="9" y="3" width="6" height="4" rx="1.5"></rect>
          <path d="m9 14 2 2 4-5"></path>
        }
        @case ('cart') {
          <circle cx="8" cy="21" r="1"></circle>
          <circle cx="19" cy="21" r="1"></circle>
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
        }
        @case ('wrench') {
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
        }
        @case ('plus') {
          <path d="M5 12h14"></path>
          <path d="M12 5v14"></path>
        }
        @case ('arrow-right') {
          <path d="M5 12h14"></path>
          <path d="m12 5 7 7-7 7"></path>
        }
        @case ('alert-triangle') {
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
          <path d="M12 9v4"></path>
          <path d="M12 17h.01"></path>
        }
        @case ('alert-circle') {
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M12 8v4"></path>
          <path d="M12 16h.01"></path>
        }
        @case ('trending-up') {
          <path d="M22 7 13.5 15.5 8.5 10.5 2 17"></path>
          <path d="M16 7h6v6"></path>
        }
        @case ('wallet') {
          <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"></path>
          <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"></path>
        }
        @case ('inbox') {
          <path d="M22 12h-6l-2 3h-4l-2-3H2"></path>
          <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
        }
        @case ('check') {
          <path d="M20 6 9 17l-5-5"></path>
        }
        @case ('clock') {
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M12 7v5l3 2"></path>
        }
        @case ('refresh') {
          <path d="M3 12a9 9 0 0 1 15.5-6.36L21 8"></path>
          <path d="M21 3v5h-5"></path>
          <path d="M21 12a9 9 0 0 1-15.5 6.36L3 16"></path>
          <path d="M3 21v-5h5"></path>
        }
        @case ('search') {
          <circle cx="11" cy="11" r="7"></circle>
          <path d="m20 20-3.5-3.5"></path>
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      line-height: 0;
    }
    svg {
      display: block;
      flex-shrink: 0;
    }
  `,
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input(20);
}
