import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateAdminUserInput } from './dto/create-admin-user.input';
import { UpdateAdminUserInput } from './dto/update-admin-user.input';
import { AdminUsersRepository } from './repository/adminUsers.repository';
import { AdminUserDocument } from './schema/adminUser.schema';

const SALT_ROUNDS = 12;

@Injectable()
export class AdminUsersService {
  constructor(private readonly adminUsersRepository: AdminUsersRepository) {}

  async create(createAdminUserInput: CreateAdminUserInput): Promise<AdminUserDocument> {
    const hashedPassword = await bcrypt.hash(createAdminUserInput.password, SALT_ROUNDS);
    return this.adminUsersRepository.create({ ...createAdminUserInput, password: hashedPassword });
  }

  async findAll(): Promise<AdminUserDocument[]> {
    return this.adminUsersRepository.findAll();
  }

  async findOne(id: string): Promise<AdminUserDocument> {
    const admin = await this.adminUsersRepository.findById(id);
    if (!admin) {
      throw new NotFoundException(`Admin avec l'id ${id} non trouvé`);
    }
    return admin;
  }

  async update(id: string, updateAdminUserInput: UpdateAdminUserInput): Promise<AdminUserDocument> {
    if (updateAdminUserInput.password) {
      updateAdminUserInput.password = await bcrypt.hash(updateAdminUserInput.password, SALT_ROUNDS);
    }
    const updatedAdmin = await this.adminUsersRepository.update(id, updateAdminUserInput);
    if (!updatedAdmin) {
      throw new NotFoundException(`Admin avec l'id ${id} non trouvé`);
    }
    return updatedAdmin;
  }

  async remove(id: string): Promise<AdminUserDocument> {
    const deletedAdmin = await this.adminUsersRepository.delete(id);
    if (!deletedAdmin) {
      throw new NotFoundException(`Admin avec l'id ${id} non trouvé`);
    }
    return deletedAdmin;
  }
}