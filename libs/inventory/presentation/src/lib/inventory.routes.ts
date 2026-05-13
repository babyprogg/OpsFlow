import { Route } from '@angular/router';
import { provideInventoryUseCases } from '@ops-flow/inventory/application';
import { provideInventoryRepositories } from '@ops-flow/inventory/infrastructure';

export const inventoryRoutes: Route[] = [
  {
    path: '',
    providers: [provideInventoryRepositories(), provideInventoryUseCases()],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/inventory-page.component').then(m => m.InventoryPageComponent),
      },
    ],
  },
];
