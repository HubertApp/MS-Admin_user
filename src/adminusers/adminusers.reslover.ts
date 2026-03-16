import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { AdminUsersService } from './adminusers.service'; // Nom supposé du service
import { CreateAdminUserInput } from './dto/create-admin-user.input';
import { UpdateAdminUserInput } from './dto/update-admin-user.input';
import { AdminUser } from './schema/adminUser.schema'; // Ou ton entité AdminUser

@Resolver('AdminUser')
export class AdminUsersResolver {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  // Mutation: createAdminUser
  @Mutation('createAdminUser')
  async create(
    @Args('createAdminUserInput') createAdminUserInput: CreateAdminUserInput,
  ) {
    return this.adminUsersService.create(createAdminUserInput);
  }

  // Query: adminusers
  @Query('adminusers')
  async findAll() {
    // Note : Ton schéma dit [User], mais logiquement ce devrait être [AdminUser]
    return this.adminUsersService.findAll();
  }

  // Query: adminuser
  @Query('adminuser')
  async findOne(@Args('id') id: number) {
    return this.adminUsersService.findOne(id);
  }

  // Mutation: updateAdminUser
  @Mutation('updateAdminUser')
  async update(
    @Args('updateAdminUserInput') updateAdminUserInput: UpdateAdminUserInput,
  ) {
    // On passe l'ID et les données à mettre à jour
    return this.adminUsersService.update(
      updateAdminUserInput.id,
      updateAdminUserInput,
    );
  }

  // Mutation: removeAdminUser
  @Mutation('removeAdminUser')
  async remove(@Args('id') id: number) {
    return this.adminUsersService.remove(id);
  }
}