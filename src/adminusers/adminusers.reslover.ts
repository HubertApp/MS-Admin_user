import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminUsersService } from './adminusers.service';
import { CreateAdminUserInput } from './dto/create-admin-user.input';
import { UpdateAdminUserInput } from './dto/update-admin-user.input';
import { AdminUser } from './schema/adminUser.schema';
import { FederatedAuthGuard } from './guards/federated-auth.guard';
import { CurrentAdminUser } from './decorators/current-admin-user.decorator';
import { UnauthorizedException } from './exceptions/unauthorized.exception';

@Resolver('AdminUser')
@UseGuards(FederatedAuthGuard)
export class AdminUsersResolver {
  constructor(private readonly adminUsersService: AdminUsersService) { }

  @Mutation('createAdminUser')
  async create(
    @Args('createAdminUserInput') createAdminUserInput: CreateAdminUserInput,
    @CurrentAdminUser() user: any,
  ) {
    console.log(`Action effectuée par : ${user.email}`);
    return this.adminUsersService.create(createAdminUserInput);
  }

  @Query('adminusers')
  async findAll(@CurrentAdminUser() user: any) {
    if (user.role !== 'SUPER_ADMIN') {
      console.log(`L'utilisateur ${user.id} a essayé d'acceder à une action admin`);
      throw new UnauthorizedException('Vous n\'avez pas les authorisations nécessaires pour cette action');
    }
    return this.adminUsersService.findAll();
  }

  @Query('adminuser')
  async findOne(@Args('id') id: number) {
    return this.adminUsersService.findOne(id);
  }

  @Mutation('updateAdminUser')
  async update(
    @Args('updateAdminUserInput') updateAdminUserInput: UpdateAdminUserInput,
    @CurrentAdminUser() user: any,
  ) {
    console.log(`L'utilisateur ${user.id} modifie l'admin ${updateAdminUserInput.id}`);

    return this.adminUsersService.update(
      updateAdminUserInput.id,
      updateAdminUserInput,
    );
  }

  @Mutation('removeAdminUser')
  async remove(@Args('id') id: number) {
    return this.adminUsersService.remove(id);
  }
}