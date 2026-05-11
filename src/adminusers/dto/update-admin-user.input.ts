import { CreateAdminUserInput } from './create-admin-user.input';
import { PartialType } from '@nestjs/mapped-types';
import { IsMongoId } from 'class-validator';

export class UpdateAdminUserInput extends PartialType(CreateAdminUserInput) {
  @IsMongoId()
  id: string;
}
