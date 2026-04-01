// Technician Repository Port - Domain Layer
import { Technician } from '../entities/technician.entity';

export abstract class TechnicianRepository {
  abstract findById(id: string): Promise<Technician | null>;
  abstract findAll(filters?: TechnicianFilters): Promise<Technician[]>;
  abstract save(technician: Technician): Promise<void>;
  abstract delete(id: string): Promise<void>;
}

export interface TechnicianFilters {
  status?: string;
  skills?: string[];
  search?: string;
}
