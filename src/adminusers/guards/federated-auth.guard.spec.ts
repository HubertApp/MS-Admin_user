import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { FederatedAuthGuard } from './federated-auth.guard';
import { UnauthorizedException } from '../exceptions/unauthorized.exception';

function buildContext(headers: Record<string, string>) {
  const req: Record<string, unknown> = { headers, ip: '127.0.0.1' };
  jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
    getContext: () => ({ req }),
  } as any);
  return { context: {} as ExecutionContext, req };
}

describe('FederatedAuthGuard', () => {
  let guard: FederatedAuthGuard;
  const savedNodeEnv = process.env.NODE_ENV;
  const savedSecret = process.env.INTERNAL_SECRET;

  beforeEach(() => {
    guard = new FederatedAuthGuard();
  });

  afterEach(() => {
    process.env.NODE_ENV = savedNodeEnv;
    process.env.INTERNAL_SECRET = savedSecret;
    jest.restoreAllMocks();
  });

  // ------------------------------------------------------------------
  // En développement (NODE_ENV !== 'production')
  // ------------------------------------------------------------------
  describe('en développement', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('accepte une requête valide et retourne true', () => {
      const { context } = buildContext({
        'x-auth-state': 'VALID',
        'x-user-id': 'user-123',
        'x-user-role': 'SUPER_ADMIN',
        'x-user-email': 'admin@example.com',
        'x-user-pseudo': 'admin',
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('peuple req.user avec les données extraites des headers', () => {
      const { context, req } = buildContext({
        'x-auth-state': 'VALID',
        'x-user-id': 'user-123',
        'x-user-role': 'SUPER_ADMIN',
        'x-user-email': 'admin@example.com',
        'x-user-pseudo': 'admin',
      });

      guard.canActivate(context);

      expect(req.user).toEqual({
        id: 'user-123',
        role: 'SUPER_ADMIN',
        email: 'admin@example.com',
        pseudo: 'admin',
      });
    });

    it('peuple les champs optionnels avec une chaîne vide quand absents', () => {
      const { context, req } = buildContext({
        'x-auth-state': 'VALID',
        'x-user-id': 'user-123',
      });

      guard.canActivate(context);

      expect((req.user as any).role).toBe('');
      expect((req.user as any).email).toBe('');
      expect((req.user as any).pseudo).toBe('');
    });

    it('rejette si x-auth-state n\'est pas VALID', () => {
      const { context } = buildContext({
        'x-auth-state': 'EXPIRED',
        'x-user-id': 'user-123',
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('rejette si x-auth-state est absent', () => {
      const { context } = buildContext({ 'x-user-id': 'user-123' });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('rejette si x-user-id est absent', () => {
      const { context } = buildContext({ 'x-auth-state': 'VALID' });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('ignore x-internal-secret en développement (même incorrect)', () => {
      const { context } = buildContext({
        'x-auth-state': 'VALID',
        'x-user-id': 'user-123',
        'x-internal-secret': 'wrong-secret',
      });

      expect(() => guard.canActivate(context)).not.toThrow();
    });

    it('l\'exception levée a le code UNAUTHENTICATED', () => {
      const { context } = buildContext({ 'x-auth-state': 'INVALID' });

      try {
        guard.canActivate(context);
        fail('aurait dû lever une exception');
      } catch (err) {
        expect(err).toBeInstanceOf(UnauthorizedException);
        expect((err as UnauthorizedException).extensions.code).toBe('UNAUTHENTICATED');
      }
    });
  });

  // ------------------------------------------------------------------
  // En production (NODE_ENV === 'production')
  // ------------------------------------------------------------------
  describe('en production', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.INTERNAL_SECRET = 'secret-correct';
    });

    it('accepte si le secret interne est correct', () => {
      const { context } = buildContext({
        'x-auth-state': 'VALID',
        'x-user-id': 'user-123',
        'x-internal-secret': 'secret-correct',
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('rejette si le secret interne est incorrect', () => {
      const { context } = buildContext({
        'x-auth-state': 'VALID',
        'x-user-id': 'user-123',
        'x-internal-secret': 'mauvais-secret',
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('rejette si le secret interne est absent', () => {
      const { context } = buildContext({
        'x-auth-state': 'VALID',
        'x-user-id': 'user-123',
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('le check du secret est prioritaire sur la validation des headers auth', () => {
      const { context } = buildContext({
        'x-auth-state': 'VALID',
        'x-user-id': 'user-123',
        'x-internal-secret': 'mauvais-secret',
      });

      // Doit throw à cause du secret, pas attendre la validation auth
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });
  });
});