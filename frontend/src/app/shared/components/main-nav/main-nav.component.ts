import { Component } from '@angular/core';
import { RouterLinkActive, RouterModule } from '@angular/router';

import { IconComponent, IconName } from '../icon/icon.component';

interface NavItem {
  label: string;
  path: string;
  icon: IconName;
  exact?: boolean;
}

@Component({
  selector: 'app-main-nav',
  standalone: true,
  imports: [RouterModule, RouterLinkActive, IconComponent],
  template: `
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-mark">
          <app-icon name="wrench" [size]="22" />
        </span>
        <span class="brand-text">
          <strong>Taller</strong>
          <span>de Reparaciones</span>
        </span>
      </div>

      <nav class="nav" aria-label="Navegación principal">
        @for (item of items; track item.path) {
          <a
            class="nav-link"
            [routerLink]="item.path"
            routerLinkActive="is-active"
            ariaCurrentWhenActive="page"
            [routerLinkActiveOptions]="item.exact ? { exact: true } : { exact: false }"
          >
            <app-icon [name]="item.icon" [size]="20" />
            <span class="label">{{ item.label }}</span>
          </a>
        }
      </nav>

      <div class="sidebar-footer">
        <span class="status-dot" aria-hidden="true"></span>
        <span class="footer-text">Sistema local</span>
      </div>
    </aside>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
      min-height: 0;
    }

    .sidebar {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 1.5rem 1rem;
      border-right: 1px solid var(--app-border);
      background: linear-gradient(180deg, #0b1222 0%, var(--app-bg) 100%);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0 0.35rem;
      margin-bottom: 2rem;
      color: var(--app-text);
    }

    .brand-mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: var(--app-radius-md);
      background: var(--app-accent);
      color: #eff6ff;
      box-shadow: 0 8px 20px rgb(37 99 235 / 35%);
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      line-height: 1.15;
      font-size: 0.95rem;
    }

    .brand-text strong {
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .brand-text span {
      color: var(--app-text-muted);
      font-size: 0.78rem;
    }

    .nav {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      padding: 0.7rem 0.85rem;
      border: 1px solid transparent;
      border-radius: var(--app-radius-md);
      color: var(--app-text-muted);
      font-size: 0.88rem;
      font-weight: 500;
      text-decoration: none;
      transition:
        background 150ms ease,
        color 150ms ease,
        border-color 150ms ease;
    }

    .nav-link:hover {
      background: rgb(148 163 184 / 8%);
      color: var(--app-text);
    }

    .nav-link.is-active {
      background: var(--app-accent-soft);
      border-color: rgb(59 130 246 / 28%);
      color: #dbeafe;
    }

    .nav-link.is-active app-icon {
      color: var(--app-accent-strong);
    }

    .sidebar-footer {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: auto;
      padding: 0.85rem;
      border-top: 1px solid var(--app-border);
      color: var(--app-text-subtle);
      font-size: 0.72rem;
    }

    .status-dot {
      width: 0.45rem;
      height: 0.45rem;
      border-radius: 999px;
      background: var(--app-success);
      box-shadow: 0 0 0 3px var(--app-success-soft);
    }

    @media (max-width: 1023px) {
      .sidebar {
        align-items: center;
        padding: 1.25rem 0.6rem;
      }

      .brand {
        padding: 0;
        margin-bottom: 1.5rem;
      }

      .brand-text,
      .label,
      .footer-text {
        display: none;
      }

      .nav-link {
        justify-content: center;
        width: 100%;
        padding: 0.7rem;
      }

      .sidebar-footer {
        justify-content: center;
        padding: 0.85rem 0;
      }
    }
  `,
})
export class MainNavComponent {
  readonly items: NavItem[] = [
    { label: 'Resumen', path: '/', icon: 'grid', exact: true },
    { label: 'Clientes', path: '/clientes', icon: 'users' },
    { label: 'Inventario', path: '/inventario', icon: 'package' },
    { label: 'Órdenes', path: '/ordenes', icon: 'clipboard' },
    { label: 'Ventas', path: '/ventas', icon: 'cart' },
  ];
}
