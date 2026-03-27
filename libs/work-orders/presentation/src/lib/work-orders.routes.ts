// Work Orders Routes - Presentation Layer
import { Route } from '@angular/router';
import { provideWorkOrderUseCases } from '@ops-flow/work-orders/application';
import { provideWorkOrderRepositories } from '@ops-flow/work-orders/infrastructure';

export const workOrderRoutes: Route[] = [
  {
    path: '',
    providers: [
      provideWorkOrderRepositories(),
      provideWorkOrderUseCases()
    ],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/work-order-list.component').then(m => m.WorkOrderListComponent)
      }
    ]
  }
];
