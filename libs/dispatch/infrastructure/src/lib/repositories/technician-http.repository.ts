// Technician HTTP Repository - Infrastructure Layer
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Technician, TechnicianRepository, TechnicianFilters } from '@ops-flow/dispatch/domain';
import { TechnicianDto, TechnicianMapper } from '../mappers/technician.mapper';

@Injectable()
export class TechnicianHttpRepository implements TechnicianRepository {
  private http = inject(HttpClient);
  private baseUrl = '/api/technicians';

  async findById(id: string): Promise<Technician | null> {
    try {
      const dto = await firstValueFrom(this.http.get<TechnicianDto>(`${this.baseUrl}/${id}`));
      return TechnicianMapper.toDomain(dto);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        return null;
      }

      throw error;
    }
  }

  async findAll(filters?: TechnicianFilters): Promise<Technician[]> {
    const params: Record<string, string> = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.skills) params.skills = filters.skills.join(',');
    if (filters?.search) params.search = filters.search;

    const dtos = await firstValueFrom(this.http.get<TechnicianDto[]>(this.baseUrl, { params }));
    return dtos.map(TechnicianMapper.toDomain);
  }

  async save(technician: Technician): Promise<void> {
    const dto = TechnicianMapper.toDto(technician);
    await firstValueFrom(this.http.post(this.baseUrl, dto));
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.baseUrl}/${id}`));
  }
}
