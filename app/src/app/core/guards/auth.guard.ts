import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { first, map } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);

  return inject(AuthService).user$.pipe(
    first(),
    map((user) => (user ? true : router.createUrlTree(['/sign-in'], { queryParams: { returnUrl: state.url } }))),
  );
};
