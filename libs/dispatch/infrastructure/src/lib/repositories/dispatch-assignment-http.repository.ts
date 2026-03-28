// DispatchAssignment HTTP Repository - Infrastructure Layer
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  DispatchAssignment,
  DispatchAssignmentRepository,
  DispatchAssignmentFilters,
  TimeSlot
} from '@ops-flow/dispatch/domain';
import { DispatchAssignmentMapper } from '../mappers/dispatch-assignment.mapper';

@Injectable()
export class DispatchAssignmentHttpRepository implements DispatchAssignmentRepository {
  private http = inject(HttpClient);
  private baseUrl = '/api/dispatch-assignments';

  async findById(id: string): Promise<DispatchAssignment | null> {
    try {
      const dto = await firstValueFrom(
        this.http.get<any>(`${this.baseUrl}/${id}`)
      );
      return DispatchAssignmentMapper.toDomain(dto);
    } catch (error) {
      console.error('Failed to fetch dispatch assignment:', error);
      return null;
    }
  }

  async findAll(filters?: DispatchAssignmentFilters): Promise<DispatchAssignment[]> {
    const params: any = {};
    if (filters?.technicianId) params.technicianId = filters.technicianId;
    if (filters?.workOrderId) params.workOrderId = filters.workOrderId;
    if (filters?.status) params.status = filters.status;
    if (filters?.startDate) params.startDate = filters.startDate.toISOString();
    if (filters?.endDate) params.endDate = filters.endDate.toISOString();

    const dtos = await firstValueFrom(
      this.http.get<any[]>(this.baseUrl, { params })
    );
    return dtos.map(DispatchAssignmentMapper.toDomain);
  }

  async findByTechnicianAndTimeSlot(technicianId: string, timeSlot: TimeSlot): Promise<DispatchAssignment[]> {
    const params = {
      technicianId,
      startTime: timeSlot.startTime.toISOString(),
      endTime: timeSlot.endTime.toISOString()
    };

    const dtos = await firstValueFrom(
      this.http.get<any[]>(`${this.baseUrl}/conflicts`, { params })
    );
    return dtos.map(DispatchAssignmentMapper.toDomain);
  }

  async save(assignment: DispatchAssignment): Promise<void> {
    const dto = DispatchAssignmentMapper.toDto(assignment);
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
