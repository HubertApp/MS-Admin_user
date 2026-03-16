import { Module } from '@nestjs/common';
import { AdminUsersService } from './adminusers.service';
import { AdminUsersResolver } from './adminusers.reslover';
import { MongooseModule } from '@nestjs/mongoose';
// Vérifie bien que AdminUser est exporté dans ton fichier schema
import { AdminUser, AdminUserSchema } from './schema/adminUser.schema'; 
import { AdminUsersRepository } from './repository/adminUsers.repository'; // Chemin corrigé

@Module({
  imports: [
    // On utilise AdminUser.name (la classe) et AdminUserSchema (le schéma)
    MongooseModule.forFeature([{ name: AdminUser.name, schema: AdminUserSchema }])
  ],
  providers: [AdminUsersResolver, AdminUsersService, AdminUsersRepository],
  exports: [AdminUsersService],
})
export class AdminUsersModule {}