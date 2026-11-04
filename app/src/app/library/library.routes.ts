import { Routes } from '@angular/router';

export const libraryRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./library-page/library-page.component').then((module) => module.LibraryPageComponent),
  },
];
