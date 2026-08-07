import { Module } from '@nestjs/common';
import { AdminUsersService } from './adminusers.service';
import { AdminUsersResolver, AdminUsersReferenceResolver, AdminUsersAuthResolver } from './adminusers.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminUser, AdminUserSchema } from './schema/adminUser.schema';
import { AdminUsersRepository } from './repository/adminUsers.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AdminUser.name, schema: AdminUserSchema }]),
  ],
  providers: [AdminUsersResolver, AdminUsersReferenceResolver, AdminUsersAuthResolver, AdminUsersService, AdminUsersRepository],
  exports: [AdminUsersService],
})
export class AdminUsersModule {}