// Client Application Layer Providers
import { Provider } from '@angular/core';
import { CreateClientUseCase } from './use-cases/create-client.use-case';
import { GetClientUseCase } from './use-cases/get-client.use-case';
import { ListClientsUseCase } from './use-cases/list-clients.use-case';

export function provideClientUseCases(): Provider[] {
  return [
    CreateClientUseCase,
    GetClientUseCase,
    ListClientsUseCase
  ];
}
