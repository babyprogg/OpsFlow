import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'clients',
    loadChildren: () =>
      import('@ops-flow/client/presentation').then(m => m.clientRoutes)
  },
  {
    path: 'contracts',
    loadChildren: () =>
      import('@ops-flow/contracts/presentation').then(m => m.contractRoutes)
  },
  {
    path: 'work-orders',
    loadChildren: () =>
      import('@ops-flow/work-orders/presentation').then(m => m.workOrderRoutes)
  },
  {
    path: 'dispatch',
    loadChildren: () =>
      import('@ops-flow/dispatch/presentation').then(m => m.dispatchRoutes)
  },
  {
    path: 'inventory',
    loadChildren: () =>
      import('@ops-flow/inventory/presentation').then(m => m.inventoryRoutes)
  },
  {
    path: 'billing',
    loadChildren: () =>
      import('@ops-flow/billing/presentation').then(m => m.billingRoutes)
  },
  {
    path: 'compliance',
    loadChildren: () =>
      import('@ops-flow/compliance/presentation').then(m => m.complianceRoutes)
  },
  {
    path: 'analytics',
    loadChildren: () =>
      import('@ops-flow/analytics/presentation').then(m => m.analyticsRoutes)
  }
];
