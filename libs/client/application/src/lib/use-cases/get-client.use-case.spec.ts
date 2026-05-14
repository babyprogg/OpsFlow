import { GetClientUseCase } from './get-client.use-case';
import { Client, ClientRepository, ClientStatus } from '@ops-flow/client/domain';

describe('GetClientUseCase', () => {
  let useCase: GetClientUseCase;
  let mockRepository: jest.Mocked<ClientRepository>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<ClientRepository>;
    useCase = new GetClientUseCase();
    (useCase as any).repository = mockRepository;
  });

  it('should retrieve a client by id', async () => {
    const mockContact = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-0123'
    };

    const mockClient = new Client(
      'client-1',
      'Acme Corp',
      ClientStatus.Active,
      mockContact,
      new Date(),
      new Date()
    );

    mockRepository.findById.mockResolvedValue(mockClient);

    const result = await useCase.execute('client-1');

    expect(result).toEqual(mockClient);
    expect(mockRepository.findById).toHaveBeenCalledWith('client-1');
  });

  it('should return null when client is not found', async () => {
    mockRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute('non-existent-id');

    expect(result).toBeNull();
    expect(mockRepository.findById).toHaveBeenCalledWith('non-existent-id');
  });

  it('should propagate repository errors', async () => {
    mockRepository.findById.mockRejectedValue(new Error('Database error'));

    await expect(useCase.execute('client-1')).rejects.toThrow('Database error');
  });
};
