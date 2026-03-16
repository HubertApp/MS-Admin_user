import { Module } from '@nestjs/common';
import { AdminUsersModule } from './adminusers/adminusers.module'; // Vérifie si c'est 'adminusers' ou 'admin-users'
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { MongooseModule } from '@nestjs/mongoose';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: true,
      typePaths: ['./**/*.graphql'],
    }),
    MongooseModule.forRoot(process.env.MONGO_URL || 'mongodb://mongodb:27017/hubertapp_adminusers'),
    AdminUsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
