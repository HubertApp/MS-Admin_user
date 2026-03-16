import { CreateAdminUserInput } from './create-admin-user.input';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateAdminUserInput extends PartialType(CreateAdminUserInput) {
  id: number;
}
