// Client Infrastructure Layer Providers
import { Provider } from '@angular/core';
import { ClientRepository } from '@ops-flow/client/domain';
import { ClientHttpRepository } from './repositories/client-http.repository';

export function provideClientRepositories(): Provider[] {
  return [
    {
      provide: ClientRepository,
      useClass: ClientHttpRepository
    }
  ];
}
