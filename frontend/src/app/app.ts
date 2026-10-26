import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AppHeaderComponent } from './shared/components/app-header/app-header.component';
import { MainNavComponent } from './shared/components/main-nav/main-nav.component';

@Component({
  imports: [RouterOutlet, MainNavComponent, AppHeaderComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('Taller de Reparaciones');
}
