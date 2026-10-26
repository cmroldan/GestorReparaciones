import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import {
  formatHeaderDateInArgentina,
  todayInArgentina,
} from '../../../core/utils/dates';
import { sectionTitle } from '../../../core/utils/section-title';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header class="app-header">
      <div class="heading">
        <p class="eyebrow">Taller de Reparaciones</p>
        <h1>{{ title() }}</h1>
      </div>
      <time class="date" [attr.datetime]="isoDate()">{{ today() }}</time>
    </header>
  `,
  styles: `
    :host {
      display: block;
    }

    .app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      min-height: 4.5rem;
      padding: 0 2rem;
      border-bottom: 1px solid var(--app-border);
      background: color-mix(in srgb, var(--app-bg) 88%, transparent);
      backdrop-filter: blur(12px);
    }

    .heading {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      min-width: 0;
    }

    .eyebrow {
      margin: 0;
      color: var(--app-text-subtle);
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      overflow: hidden;
      color: var(--app-text);
      font-size: 1.15rem;
      font-weight: 600;
      letter-spacing: -0.02em;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .date {
      flex-shrink: 0;
      color: var(--app-text-muted);
      font-size: 0.8rem;
      font-weight: 500;
    }

    @media (max-width: 640px) {
      .app-header {
        padding: 0 1rem;
      }

      .date {
        font-size: 0.72rem;
      }
    }
  `,
})
export class AppHeaderComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly title = signal(sectionTitle(this.router.url));
  readonly today = signal(formatHeaderDateInArgentina());
  readonly isoDate = signal(todayInArgentina());

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.title.set(sectionTitle(this.router.url));
        this.today.set(formatHeaderDateInArgentina());
        this.isoDate.set(todayInArgentina());
      });
  }
}
