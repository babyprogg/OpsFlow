// Work Order HTTP Repository - Infrastructure Layer
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { WorkOrder, WorkOrderRepository, WorkOrderFilters } from '@ops-flow/work-orders/domain';
import { WorkOrderMapper } from '../mappers/work-order.mapper';

@Injectable()
export class WorkOrderHttpRepository implements WorkOrderRepository {
  private http = inject(HttpClient);
  private baseUrl = '/api/work-orders';

  async findById(id: string): Promise<WorkOrder | null> {
    try {
      const dto = await firstValueFrom(
        this.http.get<any>(`${this.baseUrl}/${id}`)
      );
      return WorkOrderMapper.toDomain(dto);
    } catch (error) {
      console.error('Failed to fetch work order:', error);
      return null;
    }
  }

  async findAll(filters?: WorkOrderFilters): Promise<WorkOrder[]> {
    const params: any = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.clientId) params.clientId = filters.clientId;
    if (filters?.assignedTo) params.assignedTo = filters.assignedTo;
    if (filters?.search) params.search = filters.search;

    const dtos = await firstValueFrom(
      this.http.get<any[]>(this.baseUrl, { params })
    );
    return dtos.map(WorkOrderMapper.toDomain);
  }

  async save(workOrder: WorkOrder): Promise<void> {
    const dto = WorkOrderMapper.toDto(workOrder);
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
