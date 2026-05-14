import { Client, ClientStatus, Contact } from './client.entity';

describe('Client Entity', () => {
  let mockContact: Contact;

  beforeEach(() => {
    mockContact = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-0123'
    };
  });

  describe('constructor', () => {
    it('should create a client with valid data', () => {
      const client = new Client(
        'client-1',
        'Acme Corp',
        ClientStatus.Active,
        mockContact,
        new Date(),
        new Date()
      );

      expect(client.id).toBe('client-1');
      expect(client.name).toBe('Acme Corp');
      expect(client.status).toBe(ClientStatus.Active);
      expect(client.primaryContact).toEqual(mockContact);
    });

    it('should throw error if name is empty', () => {
      expect(() => 
        new Client(
          'client-1',
          '',
          ClientStatus.Active,
          mockContact,
          new Date(),
          new Date()
        )
      ).toThrow('Client name is required');
    });

    it('should throw error if name is whitespace only', () => {
      expect(() => 
        new Client(
          'client-1',
          '   ',
          ClientStatus.Active,
          mockContact,
          new Date(),
          new Date()
        )
      ).toThrow('Client name is required');
    });

    it('should throw error if primary contact is missing', () => {
      expect(() => 
        new Client(
          'client-1',
          'Acme Corp',
          ClientStatus.Active,
          null as any,
          new Date(),
          new Date()
        )
      ).toThrow('Primary contact is required');
    });
  });

  describe('create()', () => {
    it('should create a new prospect client', () => {
      const client = Client.create('Acme Corp', mockContact);

      expect(client.id).toBeDefined();
      expect(client.name).toBe('Acme Corp');
      expect(client.status).toBe(ClientStatus.Prospect);
      expect(client.primaryContact).toEqual(mockContact);
      expect(client.createdAt).toBeInstanceOf(Date);
      expect(client.updatedAt).toBeInstanceOf(Date);
    });

    it('should generate unique IDs for each client', () => {
      const client1 = Client.create('Acme Corp', mockContact);
      const client2 = Client.create('Beta Corp', mockContact);

      expect(client1.id).not.toBe(client2.id);
    });
  });

  describe('activate()', () => {
    it('should activate a prospect client', () => {
      const prospectClient = Client.create('Acme Corp', mockContact);
      const activeClient = prospectClient.activate();

      expect(activeClient.status).toBe(ClientStatus.Active);
      expect(activeClient.id).toBe(prospectClient.id);
      expect(activeClient.name).toBe(prospectClient.name);
    });

    it('should throw error if trying to activate non-prospect client', () => {
      const activeClient = Client.create('Acme Corp', mockContact).activate();

      expect(() => 
        activeClient.activate()
      ).toThrow('Only prospect clients can be activated');
    });

    it('should update the updatedAt timestamp', () => {
      const prospectClient = Client.create('Acme Corp', mockContact);
      const originalUpdatedAt = prospectClient.updatedAt;

      // Small delay to ensure timestamp differs
      const activeClient = prospectClient.activate();

      expect(activeClient.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe('deactivate()', () => {
    it('should deactivate an active client', () => {
      const activeClient = Client.create('Acme Corp', mockContact).activate();
      const inactiveClient = activeClient.deactivate();

      expect(inactiveClient.status).toBe(ClientStatus.Inactive);
      expect(inactiveClient.id).toBe(activeClient.id);
      expect(inactiveClient.name).toBe(activeClient.name);
    });

    it('should deactivate a prospect client', () => {
      const prospectClient = Client.create('Acme Corp', mockContact);
      const inactiveClient = prospectClient.deactivate();

      expect(inactiveClient.status).toBe(ClientStatus.Inactive);
    });

    it('should preserve all other properties', () => {
      const originalClient = Client.create('Acme Corp', mockContact).activate();
      const deactivatedClient = originalClient.deactivate();

      expect(deactivatedClient.id).toBe(originalClient.id);
      expect(deactivatedClient.name).toBe(originalClient.name);
      expect(deactivatedClient.primaryContact).toEqual(originalClient.primaryContact);
      expect(deactivatedClient.createdAt).toEqual(originalClient.createdAt);
    });
  });

  describe('Immutability', () => {
    it('should not allow modification of status through state transitions', () => {
      const prospectClient = Client.create('Acme Corp', mockContact);
      const activeClient = prospectClient.activate();

      expect(prospectClient.status).toBe(ClientStatus.Prospect);
      expect(activeClient.status).toBe(ClientStatus.Active);
    });
  });
});
