import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UnauthorizedException } from '../exceptions/unauthorized.exception';

@Injectable()
export class FederatedAuthGuard implements CanActivate {
  private readonly logger = new Logger(FederatedAuthGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context).getContext();
    const req = ctx.req;

    const isProd = process.env.NODE_ENV === 'production';
    const internalSecret = req.headers['x-internal-secret'];
    if (isProd && internalSecret !== process.env.INTERNAL_SECRET) {
      this.logger.warn(`Tentative d'accès sans secret interne valide depuis ${req.ip}`);
      throw new UnauthorizedException('Accès non autorisé');
    }

    const authState = req.headers['x-auth-state'];
    const userId = req.headers['x-user-id'];

    if (authState !== 'VALID' || !userId) {
      this.logger.warn(`Tentative d'accès avec token invalide - userId: ${userId ?? 'absent'}`);
      throw new UnauthorizedException('Connexion requise ou token invalide');
    }

    req.user = {
      id: String(userId),
      role: String(req.headers['x-user-role'] ?? ''),
      email: String(req.headers['x-user-email'] ?? ''),
      pseudo: String(req.headers['x-user-pseudo'] ?? ''),
    };

    return true;
  }
}