// Client Routes - Presentation Layer
import { Route } from '@angular/router';
import { provideClientUseCases } from '@ops-flow/client/application';
import { provideClientRepositories } from '@ops-flow/client/infrastructure';

export const clientRoutes: Route[] = [
  {
    path: '',
    providers: [
      provideClientRepositories(),
      provideClientUseCases()
    ],
    children: [
      {
        path: '',
        loadComponent: () => 
          import('./pages/client-list.component').then(m => m.ClientListComponent)
      }
    ]
  }
];
