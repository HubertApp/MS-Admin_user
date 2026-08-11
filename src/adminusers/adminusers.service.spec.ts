import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AdminUsersService } from './adminusers.service';
import { AdminUsersRepository } from './repository/adminUsers.repository';

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let repository: jest.Mocked<Pick<AdminUsersRepository, 'create' | 'findAll' | 'findById' | 'update' | 'delete'>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        {
          provide: AdminUsersRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AdminUsersService>(AdminUsersService);
    repository = module.get(AdminUsersRepository);
  });

  // ------------------------------------------------------------------
  // create
  // ------------------------------------------------------------------
  describe('create', () => {
    const input = {
      firstname: 'Jean',
      lastname: 'Dupont',
      email: 'jean@example.com',
      password: 'Password1',
      authLevel: 5,
    };

    it('stocke un hash bcrypt, pas le mot de passe brut', async () => {
      // Le repository reçoit les données telles que le service les transmet
      repository.create.mockImplementation(async (data) => data as any);

      const result = await service.create(input);

      expect(result.password).not.toBe(input.password);
      const match = await bcrypt.compare(input.password, result.password);
      expect(match).toBe(true);
    }, 10_000);

    it('ne modifie pas les autres champs avant de les passer au repository', async () => {
      repository.create.mockImplementation(async (data) => data as any);

      const result = await service.create(input);

      expect(result.firstname).toBe('Jean');
      expect(result.email).toBe('jean@example.com');
      expect(result.authLevel).toBe(5);
    }, 10_000);

    it('appelle repository.create avec le hash, pas le mot de passe brut', async () => {
      repository.create.mockResolvedValue({} as any);

      await service.create(input);

      const [storedData] = repository.create.mock.calls[0];
      expect((storedData as any).password).not.toBe(input.password);
      const match = await bcrypt.compare(input.password, (storedData as any).password);
      expect(match).toBe(true);
    }, 10_000);
  });

  // ------------------------------------------------------------------
  // findAll
  // ------------------------------------------------------------------
  describe('findAll', () => {
    it('retourne la liste complète fournie par le repository', async () => {
      const admins = [{ id: '1' }, { id: '2' }] as any[];
      repository.findAll.mockResolvedValue(admins);

      const result = await service.findAll();

      expect(result).toBe(admins);
      expect(result).toHaveLength(2);
    });

    it('retourne un tableau vide quand il n\'y a aucun admin', async () => {
      repository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  // ------------------------------------------------------------------
  // findOne
  // ------------------------------------------------------------------
  describe('findOne', () => {
    it('retourne l\'admin quand il existe', async () => {
      const admin = { id: '507f1f77bcf86cd799439011', firstname: 'Jean' } as any;
      repository.findById.mockResolvedValue(admin);

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(result).toBe(admin);
    });

    it('lève NotFoundException quand l\'id est inconnu', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('id-inexistant')).rejects.toThrow(NotFoundException);
    });

    it('inclut l\'id dans le message d\'erreur', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('id-xyz')).rejects.toThrow('id-xyz');
    });
  });

  // ------------------------------------------------------------------
  // update
  // ------------------------------------------------------------------
  describe('update', () => {
    it('hache le nouveau mot de passe quand il est fourni', async () => {
      let capturedPassword = '';
      repository.update.mockImplementation(async (_id, data) => {
        capturedPassword = (data as any).password;
        return { id: '507f1f77bcf86cd799439011', ...(data as any) } as any;
      });

      await service.update('507f1f77bcf86cd799439011', { id: '507f1f77bcf86cd799439011', password: 'NewPass1' } as any);

      expect(capturedPassword).not.toBe('NewPass1');
      const match = await bcrypt.compare('NewPass1', capturedPassword);
      expect(match).toBe(true);
    }, 10_000);

    it('ne touche pas le champ password quand il n\'est pas fourni', async () => {
      repository.update.mockResolvedValue({ id: '507f1f77bcf86cd799439011', firstname: 'Marie' } as any);

      await service.update('507f1f77bcf86cd799439011', { id: '507f1f77bcf86cd799439011', firstname: 'Marie' } as any);

      const [, data] = repository.update.mock.calls[0];
      expect((data as any).password).toBeUndefined();
    });

    it('retourne l\'admin mis à jour', async () => {
      const updated = { id: '507f1f77bcf86cd799439011', firstname: 'Marie' } as any;
      repository.update.mockResolvedValue(updated);

      const result = await service.update('507f1f77bcf86cd799439011', { id: '507f1f77bcf86cd799439011', firstname: 'Marie' } as any);

      expect(result).toBe(updated);
    });

    it('lève NotFoundException quand l\'id est inconnu', async () => {
      repository.update.mockResolvedValue(null);

      await expect(
        service.update('id-inexistant', { id: 'id-inexistant' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ------------------------------------------------------------------
  // remove
  // ------------------------------------------------------------------
  describe('remove', () => {
    it('retourne l\'admin supprimé', async () => {
      const admin = { id: '507f1f77bcf86cd799439011' } as any;
      repository.delete.mockResolvedValue(admin);

      const result = await service.remove('507f1f77bcf86cd799439011');

      expect(result).toBe(admin);
    });

    it('lève NotFoundException quand l\'id est inconnu', async () => {
      repository.delete.mockResolvedValue(null);

      await expect(service.remove('id-inexistant')).rejects.toThrow(NotFoundException);
    });

    it('inclut l\'id dans le message d\'erreur', async () => {
      repository.delete.mockResolvedValue(null);

      await expect(service.remove('id-xyz')).rejects.toThrow('id-xyz');
    });
  });
});
