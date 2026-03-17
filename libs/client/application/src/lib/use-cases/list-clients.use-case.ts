// List Clients Use Case - Application Layer
import { inject, Injectable } from '@angular/core';
import { Client, ClientRepository, ClientFilters } from '@ops-flow/client/domain';

@Injectable()
export class ListClientsUseCase {
  private repository = inject(ClientRepository);

  async execute(filters?: ClientFilters): Promise<Client[]> {
    return this.repository.findAll(filters);
  }
}
