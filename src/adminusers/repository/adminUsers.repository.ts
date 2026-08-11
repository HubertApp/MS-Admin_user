import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongooseBaseRepository } from '../../common/repository/mongoose-base.repository';
import { AdminUser, AdminUserDocument } from "../schema/adminUser.schema";

@Injectable()
export class AdminUsersRepository extends MongooseBaseRepository<AdminUserDocument> {
  constructor(
    @InjectModel(AdminUser.name) userModel: Model<AdminUserDocument>,
  ) {
    super(userModel);
  }

  async findByEmail(email: string): Promise<AdminUserDocument | null> {
    return this.model.findOne({ email }).exec();
  }

  async findByEmailWithPassword(email: string): Promise<AdminUserDocument | null> {
    return this.model.findOne({ email }).select('+password').exec();
  }

}