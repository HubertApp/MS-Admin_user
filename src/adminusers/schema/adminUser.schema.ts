
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AdminUserDocument = HydratedDocument<AdminUser>;

@Schema()
export class AdminUser {

    @Prop()
    id: number;

    @Prop()
    firstname: string;

    @Prop()
    lastname: string;

    @Prop()
    email: string;

    @Prop()
    password: string;

    @Prop()
    authLevel: number;
}

export const AdminUserSchema = SchemaFactory.createForClass(AdminUser);
