// Client Repository Port - Domain Layer
import { Client } from '../entities/client.entity';

export abstract class ClientRepository {
  abstract findById(id: string): Promise<Client | null>;
  abstract findAll(filters?: ClientFilters): Promise<Client[]>;
  abstract save(client: Client): Promise<void>;
  abstract delete(id: string): Promise<void>;
}

export interface ClientFilters {
  status?: string;
  search?: string;
}
