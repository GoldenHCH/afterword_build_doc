import { Routes } from '@angular/router';

export const briefingsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./briefings-page/briefings-page.component').then((module) => module.BriefingsPageComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./briefings-page/briefings-page.component').then((module) => module.BriefingsPageComponent),
  },
];
