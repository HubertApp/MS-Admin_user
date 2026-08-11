import { Test, TestingModule } from '@nestjs/testing';
import { AdminUsersResolver, AdminUsersReferenceResolver } from './adminusers.resolver';
import { AdminUsersService } from './adminusers.service';
import { UnauthorizedException } from './exceptions/unauthorized.exception';
import { FederatedAuthGuard } from './guards/federated-auth.guard';

const SUPER_ADMIN = { id: 'admin-1', role: 'SUPER_ADMIN', email: 'admin@test.com', pseudo: 'admin' };
const REGULAR_USER = { id: 'user-1', role: 'USER', email: 'user@test.com', pseudo: 'user' };

describe('AdminUsersResolver', () => {
  let resolver: AdminUsersResolver;
  let service: jest.Mocked<Pick<AdminUsersService, 'create' | 'findAll' | 'findOne' | 'update' | 'remove'>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUsersResolver,
        {
          provide: AdminUsersService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<AdminUsersResolver>(AdminUsersResolver);
    service = module.get(AdminUsersService);
  });

  // ------------------------------------------------------------------
  // createAdminUser
  // ------------------------------------------------------------------
  describe('create', () => {
    const input = {
      firstname: 'Jean',
      lastname: 'Dupont',
      email: 'jean@test.com',
      password: 'Password1',
      authLevel: 1,
    };

    it('un SUPER_ADMIN peut créer un admin', async () => {
      const created = { id: 'new-1', ...input };
      service.create.mockResolvedValue(created as any);

      const result = await resolver.create(input as any, SUPER_ADMIN);

      expect(service.create).toHaveBeenCalledWith(input);
      expect(result).toMatchObject({ id: 'new-1' });
    });

    it('un non-SUPER_ADMIN ne peut pas créer un admin', async () => {
      await expect(resolver.create(input as any, REGULAR_USER)).rejects.toThrow(UnauthorizedException);
      expect(service.create).not.toHaveBeenCalled();
    });

    it('le service n\'est pas appelé si l\'accès est refusé', async () => {
      try {
        await resolver.create(input as any, REGULAR_USER);
      } catch {}
      expect(service.create).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------------
  // adminUsers (findAll)
  // ------------------------------------------------------------------
  describe('findAll', () => {
    it('un SUPER_ADMIN peut lister tous les admins', async () => {
      service.findAll.mockResolvedValue([{ id: '1' }, { id: '2' }] as any[]);

      const result = await resolver.findAll(SUPER_ADMIN);

      expect(result).toHaveLength(2);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('un non-SUPER_ADMIN ne peut pas lister les admins', async () => {
      await expect(resolver.findAll(REGULAR_USER)).rejects.toThrow(UnauthorizedException);
      expect(service.findAll).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------------
  // adminUser (findOne)
  // ------------------------------------------------------------------
  describe('findOne', () => {
    it('un SUPER_ADMIN peut consulter n\'importe quel profil', async () => {
      service.findOne.mockResolvedValue({ id: 'other-user' } as any);

      await resolver.findOne('other-user', SUPER_ADMIN);

      expect(service.findOne).toHaveBeenCalledWith('other-user');
    });

    it('un utilisateur peut consulter son propre profil', async () => {
      service.findOne.mockResolvedValue({ id: 'user-1' } as any);

      await resolver.findOne('user-1', REGULAR_USER);

      expect(service.findOne).toHaveBeenCalledWith('user-1');
    });

    it('un utilisateur ne peut pas consulter le profil d\'un autre', async () => {
      await expect(resolver.findOne('other-user', REGULAR_USER)).rejects.toThrow(UnauthorizedException);
      expect(service.findOne).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------------
  // updateAdminUser
  // ------------------------------------------------------------------
  describe('update', () => {
    it('un SUPER_ADMIN peut modifier n\'importe quel profil', async () => {
      service.update.mockResolvedValue({ id: 'user-99', firstname: 'Modifié' } as any);

      await resolver.update({ id: 'user-99', firstname: 'Modifié' } as any, SUPER_ADMIN);

      expect(service.update).toHaveBeenCalledWith('user-99', { id: 'user-99', firstname: 'Modifié' });
    });

    it('un utilisateur peut modifier son propre profil', async () => {
      service.update.mockResolvedValue({ id: 'user-1', firstname: 'Modifié' } as any);

      await resolver.update({ id: 'user-1', firstname: 'Modifié' } as any, REGULAR_USER);

      expect(service.update).toHaveBeenCalled();
    });

    it('un utilisateur ne peut pas modifier le profil d\'un autre', async () => {
      await expect(
        resolver.update({ id: 'other-user', firstname: 'Hack' } as any, REGULAR_USER),
      ).rejects.toThrow(UnauthorizedException);
      expect(service.update).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------------
  // removeAdminUser
  // ------------------------------------------------------------------
  describe('remove', () => {
    it('un SUPER_ADMIN peut supprimer un admin', async () => {
      service.remove.mockResolvedValue({ id: 'user-99' } as any);

      await resolver.remove('user-99', SUPER_ADMIN);

      expect(service.remove).toHaveBeenCalledWith('user-99');
    });

    it('un non-SUPER_ADMIN ne peut pas supprimer un admin', async () => {
      await expect(resolver.remove('user-1', REGULAR_USER)).rejects.toThrow(UnauthorizedException);
      expect(service.remove).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------------
  // Métadonnées du guard — vérifie que @UseGuards est bien appliqué
  // ------------------------------------------------------------------
  describe('application du FederatedAuthGuard', () => {
    it('FederatedAuthGuard est enregistré sur la classe AdminUsersResolver', () => {
      const guards: unknown[] = Reflect.getMetadata('__guards__', AdminUsersResolver) ?? [];
      expect(guards).toContain(FederatedAuthGuard);
    });

    it('AdminUsersReferenceResolver n\'a pas de guard (résolveur de fédération interne)', () => {
      const guards: unknown[] = Reflect.getMetadata('__guards__', AdminUsersReferenceResolver) ?? [];
      expect(guards).not.toContain(FederatedAuthGuard);
    });

    it('le guard est appliqué au niveau classe, pas méthode par méthode', () => {
      const classGuards: unknown[] = Reflect.getMetadata('__guards__', AdminUsersResolver) ?? [];
      const methodGuards: unknown[] = Reflect.getMetadata('__guards__', AdminUsersResolver.prototype, 'create') ?? [];

      expect(classGuards).toContain(FederatedAuthGuard);
      expect(methodGuards).not.toContain(FederatedAuthGuard);
    });
  });
});

// ------------------------------------------------------------------
// AdminUsersReferenceResolver (Apollo Federation)
// ------------------------------------------------------------------
describe('AdminUsersReferenceResolver', () => {
  let resolver: AdminUsersReferenceResolver;
  let service: jest.Mocked<Pick<AdminUsersService, 'findOne'>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUsersReferenceResolver,
        {
          provide: AdminUsersService,
          useValue: { findOne: jest.fn() },
        },
      ],
    }).compile();

    resolver = module.get<AdminUsersReferenceResolver>(AdminUsersReferenceResolver);
    service = module.get(AdminUsersService);
  });

  it('résout une référence Apollo Federation par id', async () => {
    const admin = { id: 'abc123' } as any;
    service.findOne.mockResolvedValue(admin);

    const result = await resolver.resolveReference({ __typename: 'AdminUser', id: 'abc123' });

    expect(service.findOne).toHaveBeenCalledWith('abc123');
    expect(result).toBe(admin);
  });
});
