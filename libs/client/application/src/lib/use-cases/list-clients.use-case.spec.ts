import { ListClientsUseCase } from './list-clients.use-case';
import { Client, ClientRepository, ClientStatus, ClientFilters } from '@ops-flow/client/domain';

describe('ListClientsUseCase', () => {
  let useCase: ListClientsUseCase;
  let mockRepository: jest.Mocked<ClientRepository>;

  beforeEach(() => {
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<ClientRepository>;
    useCase = new ListClientsUseCase();
    (useCase as any).repository = mockRepository;
  });

  it('should list all clients without filters', async () => {
    const mockContact = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-0123'
    };

    const mockClients = [
      new Client('client-1', 'Acme Corp', ClientStatus.Active, mockContact, new Date(), new Date()),
      new Client('client-2', 'Beta Corp', ClientStatus.Prospect, mockContact, new Date(), new Date())
    ];

    mockRepository.findAll.mockResolvedValue(mockClients);

    const result = await useCase.execute();

    expect(result).toEqual(mockClients);
    expect(result.length).toBe(2);
    expect(mockRepository.findAll).toHaveBeenCalledWith(undefined);
  });

  it('should list clients with filters', async () => {
    const mockContact = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-0123'
    };

    const mockClients = [
      new Client('client-1', 'Acme Corp', ClientStatus.Active, mockContact, new Date(), new Date())
    ];

    mockRepository.findAll.mockResolvedValue(mockClients);

    const filters: ClientFilters = { status: ClientStatus.Active };
    const result = await useCase.execute(filters);

    expect(result).toEqual(mockClients);
    expect(mockRepository.findAll).toHaveBeenCalledWith(filters);
  });

  it('should return empty list when no clients match', async () => {
    mockRepository.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  it('should handle search filters', async () => {
    const mockContact = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-0123'
    };

    const mockClients = [
      new Client('client-1', 'Acme Corp', ClientStatus.Active, mockContact, new Date(), new Date())
    ];

    mockRepository.findAll.mockResolvedValue(mockClients);

    const filters: ClientFilters = { search: 'Acme' };
    const result = await useCase.execute(filters);

    expect(result).toEqual(mockClients);
    expect(mockRepository.findAll).toHaveBeenCalledWith(filters);
  });

  it('should propagate repository errors', async () => {
    mockRepository.findAll.mockRejectedValue(new Error('Database error'));

    await expect(useCase.execute()).rejects.toThrow('Database error');
  });
});
