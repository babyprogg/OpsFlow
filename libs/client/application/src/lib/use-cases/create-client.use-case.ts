// Create Client Use Case - Application Layer
import { inject, Injectable } from '@angular/core';
import { Client, ClientRepository, Contact } from '@ops-flow/client/domain';

export interface CreateClientCommand {
  name: string;
  primaryContact: Contact;
}

@Injectable()
export class CreateClientUseCase {
  private repository = inject(ClientRepository);

  async execute(command: CreateClientCommand): Promise<Client> {
    // Business logic orchestration
    const client = Client.create(command.name, command.primaryContact);
    
    // Persist via repository
    await this.repository.save(client);
    
    return client;
  }
}
