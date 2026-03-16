import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAdminUserInput } from './dto/create-admin-user.input';
import { UpdateAdminUserInput } from './dto/update-admin-user.input';
import { AdminUsersRepository } from './repository/adminUsers.repository';
import { AdminUserDocument } from './schema/adminUser.schema';

@Injectable()
export class AdminUsersService {
  constructor(private readonly adminUsersRepository: AdminUsersRepository) {}

  async create(createAdminUserInput: CreateAdminUserInput): Promise<AdminUserDocument> {
    // On crée l'admin et on retourne le résultat
    return await this.adminUsersRepository.create(createAdminUserInput);
  }

  async findAll(): Promise<AdminUserDocument[]> {
    return await this.adminUsersRepository.findAll();
  }

  async findOne(id: number): Promise<AdminUserDocument> {
    const admin = await this.adminUsersRepository.findById(id);
    
    if (!admin) {
      throw new NotFoundException(`Admin avec l'id ${id} non trouvé`);
    }
    return admin;
  }

  async update(id: number, updateAdminUserInput: UpdateAdminUserInput): Promise<AdminUserDocument> {
    const updatedAdmin = await this.adminUsersRepository.update(id, updateAdminUserInput);
    
    if (!updatedAdmin) {
      throw new NotFoundException(`Admin avec l'id ${id} non trouvé`);
    }
    return updatedAdmin;
  }

  async remove(id: number): Promise<AdminUserDocument> {
    const deletedAdmin = await this.adminUsersRepository.delete(id);
    
    if (!deletedAdmin) {
      throw new NotFoundException(`Admin avec l'id ${id} non trouvé`);
    }

    return deletedAdmin;
  }
}