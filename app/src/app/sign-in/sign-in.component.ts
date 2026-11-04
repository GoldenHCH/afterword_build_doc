import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs';

import { AuthService } from '../core/services/auth.service';
import { AlertBannerComponent } from '../shared/components/alert-banner/alert-banner.component';
import { ignoredSignInErrorCodes, signInCopy } from './sign-in.constants';

@Component({
  selector: 'aw-sign-in',
  standalone: true,
  imports: [
    AlertBannerComponent,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss',
})
export class SignInComponent implements OnInit {
  private readonly _authService = inject(AuthService);
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);

  public readonly copy = signInCopy;
  public isDemoOpen = false;
  public isSigningIn = false;
  public errorMessage = '';
  public demoEmail: string = signInCopy.DEMO_EMAIL;
  public demoPassword = '';

  public ngOnInit(): void {
    this._authService.user$.pipe(first()).subscribe((user) => {
      if (user) {
        void this._router.navigateByUrl(this._returnUrl());
      }
    });
  }

  public onToggleDemo(): void {
    this.isDemoOpen = !this.isDemoOpen;
    this.errorMessage = '';
  }

  public async onGoogleSignIn(): Promise<void> {
    await this._run(() => this._authService.signInWithGoogle());
  }

  public async onDemoSignIn(): Promise<void> {
    await this._run(() => this._authService.signInWithDemo(this.demoEmail.trim(), this.demoPassword));
  }

  private async _run(signIn: () => Promise<void>): Promise<void> {
    if (this.isSigningIn) {
      return;
    }

    this.isSigningIn = true;
    this.errorMessage = '';

    try {
      await signIn();
      await this._router.navigateByUrl(this._returnUrl());
    } catch (error) {
      console.error('Sign-in failed', error);
      this.errorMessage = this._messageFor(error);
    } finally {
      this.isSigningIn = false;
    }
  }

  private _messageFor(error: unknown): string {
    const code = (error as { code?: string }).code ?? '';

    if ((ignoredSignInErrorCodes as readonly string[]).includes(code)) {
      return '';
    }

    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return signInCopy.ERROR_CREDENTIALS;
    }

    if (code === 'auth/network-request-failed') {
      return signInCopy.ERROR_NETWORK;
    }

    return signInCopy.ERROR_GENERIC;
  }

  private _returnUrl(): string {
    const returnUrl = this._route.snapshot.queryParamMap.get('returnUrl') ?? '';

    return returnUrl.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/notes';
  }
}
