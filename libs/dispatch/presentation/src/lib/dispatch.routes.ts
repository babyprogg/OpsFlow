// Dispatch Routes - Presentation Layer
import { Route } from '@angular/router';
import { provideDispatchUseCases } from '@ops-flow/dispatch/application';
import { provideDispatchRepositories } from '@ops-flow/dispatch/infrastructure';

export const dispatchRoutes: Route[] = [
  {
    path: '',
    providers: [provideDispatchRepositories(), provideDispatchUseCases()],
    children: [
      // Placeholder for future dispatch components
      // {
      //   path: '',
      //   loadComponent: () =>
      //     import('./pages/dispatch-list.component').then(m => m.DispatchListComponent),
      // },
    ],
  },
];
