import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, first, from, map, of, switchMap } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return authService.user$.pipe(
    first(),
    switchMap((user) => {
      if (!user) {
        return of(router.createUrlTree(['/sign-in'], { queryParams: { returnUrl: state.url } }));
      }

      return from(authService.ensureProfile(user)).pipe(
        map(() => true),
        catchError((error) => {
          console.error('Could not confirm the user profile', error);

          return of(true);
        }),
      );
    }),
  );
};
