// Client Mapper - Infrastructure Layer
import { Client, ClientStatus, Contact } from '@ops-flow/client/domain';

export class ClientMapper {
  static toDomain(dto: any): Client {
    return new Client(
      dto.id,
      dto.name,
      dto.status as ClientStatus,
      {
        id: dto.primaryContact.id,
        firstName: dto.primaryContact.firstName,
        lastName: dto.primaryContact.lastName,
        email: dto.primaryContact.email,
        phone: dto.primaryContact.phone
      } as Contact,
      new Date(dto.createdAt),
      new Date(dto.updatedAt)
    );
  }

  static toDto(client: Client): any {
    return {
      id: client.id,
      name: client.name,
      status: client.status,
      primaryContact: {
        id: client.primaryContact.id,
        firstName: client.primaryContact.firstName,
        lastName: client.primaryContact.lastName,
        email: client.primaryContact.email,
        phone: client.primaryContact.phone
      },
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString()
    };
  }
}
