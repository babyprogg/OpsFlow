// Technician Mapper - Infrastructure Layer
import { Technician, TechnicianStatus } from '@ops-flow/dispatch/domain';

export interface TechnicianDto {
  id: string;
  name: string;
  email: string;
  skills: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export class TechnicianMapper {
  static toDomain(dto: TechnicianDto): Technician {
    return new Technician(
      dto.id,
      dto.name,
      dto.email,
      dto.skills,
      dto.status as TechnicianStatus,
      new Date(dto.createdAt),
      new Date(dto.updatedAt)
    );
  }

  static toDto(technician: Technician): TechnicianDto {
    return {
      id: technician.id,
      name: technician.name,
      email: technician.email,
      skills: technician.skills,
      status: technician.status,
      createdAt: technician.createdAt.toISOString(),
      updatedAt: technician.updatedAt.toISOString()
    };
  }
}
