import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UnauthorizedException } from '../exceptions/unauthorized.exception';

@Injectable()
export class FederatedAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context).getContext();
    const req = ctx.req;

    const authState = req.headers['x-auth-state'];
    const userId = req.headers['x-user-id'];

    if (authState !== 'VALID' || !userId) {
      throw new UnauthorizedException('Connexion requise ou token invalide');
    }

    req.user = {
      id: userId,
      role: req.headers['x-user-role'],
      email: req.headers['x-user-email'],
      pseudo: req.headers['x-user-pseudo'],
      age: req.headers['x-user-age'],
    };

    return true;
  }
}