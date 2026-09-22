import { Resolver, Query, Mutation, Args, ResolveReference, Directive } from '@nestjs/graphql';
import { Logger, UseGuards } from '@nestjs/common';
import { AdminUsersService } from './adminusers.service';
import { CreateAdminUserInput } from './dto/create-admin-user.input';
import { UpdateAdminUserInput } from './dto/update-admin-user.input';
import { FederatedAuthGuard } from './guards/federated-auth.guard';
import { CurrentAdminUser } from './decorators/current-admin-user.decorator';
import { UnauthorizedException } from './exceptions/unauthorized.exception';

interface RequestUser {
  id: string;
  role: string;
  email: string;
  pseudo: string;
}

const SUPER_ADMIN = 'SUPER_ADMIN';

@Resolver('AdminUser')
@UseGuards(FederatedAuthGuard)
export class AdminUsersResolver {
  private readonly logger = new Logger(AdminUsersResolver.name);

  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Mutation('createAdminUser')
  async create(
    @Args('createAdminUserInput') createAdminUserInput: CreateAdminUserInput,
    @CurrentAdminUser() user: RequestUser,
  ) {
    if (user.role !== SUPER_ADMIN) {
      this.logger.warn(`Accès refusé à createAdminUser pour userId=${user.id}`);
      throw new UnauthorizedException('Seul un SUPER_ADMIN peut créer un admin');
    }
    this.logger.log(`createAdminUser déclenché par userId=${user.id}`);
    return this.adminUsersService.create(createAdminUserInput);
  }

  @Query('adminUsers')
  async findAll(@CurrentAdminUser() user: RequestUser) {
    if (user.role !== SUPER_ADMIN) {
      this.logger.warn(`Accès refusé à adminusers pour userId=${user.id}`);
      throw new UnauthorizedException('Vous n\'avez pas les autorisations nécessaires pour cette action');
    }
    return this.adminUsersService.findAll();
  }

  @Query('adminUser')
  async findOne(
    @Args('id') id: string,
    @CurrentAdminUser() user: RequestUser,
  ) {
    if (user.role !== SUPER_ADMIN && user.id !== id) {
      this.logger.warn(`Accès refusé à adminuser(${id}) pour userId=${user.id}`);
      throw new UnauthorizedException('Vous ne pouvez consulter que votre propre profil');
    }
    return this.adminUsersService.findOne(id);
  }

  @Mutation('updateAdminUser')
  async update(
    @Args('updateAdminUserInput') updateAdminUserInput: UpdateAdminUserInput,
    @CurrentAdminUser() user: RequestUser,
  ) {
    if (user.role !== SUPER_ADMIN && user.id !== updateAdminUserInput.id) {
      this.logger.warn(`Accès refusé à updateAdminUser(${updateAdminUserInput.id}) pour userId=${user.id}`);
      throw new UnauthorizedException('Vous ne pouvez modifier que votre propre profil');
    }
    this.logger.log(`updateAdminUser(${updateAdminUserInput.id}) déclenché par userId=${user.id}`);
    return this.adminUsersService.update(updateAdminUserInput.id, updateAdminUserInput);
  }

  @Mutation('removeAdminUser')
  async remove(
    @Args('id') id: string,
    @CurrentAdminUser() user: RequestUser,
  ) {
    if (user.role !== SUPER_ADMIN) {
      this.logger.warn(`Accès refusé à removeAdminUser(${id}) pour userId=${user.id}`);
      throw new UnauthorizedException('Seul un SUPER_ADMIN peut supprimer un admin');
    }
    this.logger.log(`removeAdminUser(${id}) déclenché par userId=${user.id}`);
    return this.adminUsersService.remove(id);
  }
}

// Résolveur dédié à la fédération Apollo — appelé par le Router, pas par les utilisateurs finaux
@Resolver('AdminUser')
export class AdminUsersReferenceResolver {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @ResolveReference()
  async resolveReference(reference: { __typename: string; id: string }) {
    return this.adminUsersService.findOne(reference.id);
  }
}

// Pas de FederatedAuthGuard ici : c'est justement la query qui sert à s'authentifier.
@Resolver('AdminUser')
@Directive('@inaccessible')
export class AdminUsersAuthResolver {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Query('byEmailAndPassword')
  
  async byEmailAndPassword(
    @Args('email') email: string,
    @Args('password') password: string,
  ) {
    return this.adminUsersService.findByEmailAndPassword(email, password);
  }
}
