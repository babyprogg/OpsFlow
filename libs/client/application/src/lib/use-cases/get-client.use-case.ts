// Get Client Use Case - Application Layer
import { inject, Injectable } from '@angular/core';
import { Client, ClientRepository } from '@ops-flow/client/domain';

@Injectable()
export class GetClientUseCase {
  private repository = inject(ClientRepository);

  async execute(id: string): Promise<Client | null> {
    return this.repository.findById(id);
  }
}
