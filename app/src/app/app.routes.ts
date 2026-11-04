import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { ShellComponent } from './core/shell/shell.component';

export const routes: Routes = [
  {
    path: 'sign-in',
    loadComponent: () => import('./sign-in/sign-in.component').then((module) => module.SignInComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'notes', loadChildren: () => import('./notes/notes.routes').then((module) => module.notesRoutes) },
      {
        path: 'briefings',
        loadChildren: () => import('./briefings/briefings.routes').then((module) => module.briefingsRoutes),
      },
      { path: 'library', loadChildren: () => import('./library/library.routes').then((module) => module.libraryRoutes) },
      { path: '', pathMatch: 'full', redirectTo: 'notes' },
    ],
  },
  { path: '**', redirectTo: 'notes' },
];
