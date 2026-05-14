import { CreateClientUseCase } from './create-client.use-case';
import { Client, ClientRepository, ClientStatus } from '@ops-flow/client/domain';

describe('CreateClientUseCase', () => {
  let useCase: CreateClientUseCase;
  let mockRepository: jest.Mocked<ClientRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<ClientRepository>;

    useCase = new CreateClientUseCase();
    (useCase as any).repository = mockRepository;
  });

  it('should create and persist a new client', async () => {
    const mockContact = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-0123'
    };

    mockRepository.save.mockResolvedValue(undefined);

    const result = await useCase.execute({
      name: 'Acme Corp',
      primaryContact: mockContact
    });

    expect(result).toBeInstanceOf(Client);
    expect(result.name).toBe('Acme Corp');
    expect(result.status).toBe(ClientStatus.Prospect);
    expect(result.primaryContact).toEqual(mockContact);
    expect(mockRepository.save).toHaveBeenCalledWith(result);
  });

  it('should throw error when repository save fails', async () => {
    const mockContact = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-0123'
    };

    mockRepository.save.mockRejectedValue(new Error('Database error'));

    await expect(
      useCase.execute({
        name: 'Acme Corp',
        primaryContact: mockContact
      })
    ).rejects.toThrow('Database error');
  });

  it('should propagate domain validation errors', async () => {
    const mockContact = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-0123'
    };

    await expect(
      useCase.execute({
        name: '',
        primaryContact: mockContact
      })
    ).rejects.toThrow('Client name is required');

    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should generate unique IDs for each created client', async () => {
    const mockContact = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-0123'
    };

    mockRepository.save.mockResolvedValue(undefined);

    const client1 = await useCase.execute({
      name: 'Acme Corp',
      primaryContact: mockContact
    });

    const client2 = await useCase.execute({
      name: 'Beta Corp',
      primaryContact: mockContact
    });

    expect(client1.id).not.toBe(client2.id);
  });
};
