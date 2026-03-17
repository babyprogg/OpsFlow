// Client HTTP Repository - Infrastructure Layer
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Client, ClientRepository, ClientFilters } from '@ops-flow/client/domain';
import { ClientMapper } from '../mappers/client.mapper';

@Injectable()
export class ClientHttpRepository implements ClientRepository {
  private http = inject(HttpClient);
  private baseUrl = '/api/clients';

  async findById(id: string): Promise<Client | null> {
    try {
      const dto = await firstValueFrom(
        this.http.get<any>(`${this.baseUrl}/${id}`)
      );
      return ClientMapper.toDomain(dto);
    } catch (error) {
      console.error('Failed to fetch client:', error);
      return null;
    }
  }

  async findAll(filters?: ClientFilters): Promise<Client[]> {
    const params: any = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.search) params.search = filters.search;

    const dtos = await firstValueFrom(
      this.http.get<any[]>(this.baseUrl, { params })
    );
    return dtos.map(ClientMapper.toDomain);
  }

  async save(client: Client): Promise<void> {
    const dto = ClientMapper.toDto(client);
    await firstValueFrom(
      this.http.post(this.baseUrl, dto)
    );
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${this.baseUrl}/${id}`)
    );
  }
}
