// Dispatch Infrastructure Layer Providers
import { Provider } from '@angular/core';
import { TechnicianRepository, DispatchAssignmentRepository } from '@ops-flow/dispatch/domain';
import { TechnicianHttpRepository } from './repositories/technician-http.repository';
import { DispatchAssignmentHttpRepository } from './repositories/dispatch-assignment-http.repository';

export function provideDispatchRepositories(): Provider[] {
  return [
    { provide: TechnicianRepository, useClass: TechnicianHttpRepository },
    { provide: DispatchAssignmentRepository, useClass: DispatchAssignmentHttpRepository }
  ];
}
