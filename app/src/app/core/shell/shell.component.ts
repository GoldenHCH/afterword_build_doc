import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { LoadingService } from '../../shared/services/loading.service';
import { AuthService } from '../services/auth.service';
import { navItems } from './shell.constants';

@Component({
  selector: 'aw-shell',
  standalone: true,
  imports: [AsyncPipe, MatButtonModule, MatIconModule, MatProgressBarModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly _authService = inject(AuthService);
  private readonly _router = inject(Router);
  private readonly _loadingService = inject(LoadingService);

  public readonly navItems = navItems;
  public readonly isLoading$ = this._loadingService.isLoading$;

  public async onSignOut(): Promise<void> {
    await this._authService.signOut();
    await this._router.navigate(['/sign-in']);
  }
}
