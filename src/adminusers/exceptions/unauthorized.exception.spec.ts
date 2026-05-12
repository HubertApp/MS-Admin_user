import { GraphQLError } from 'graphql';
import { UnauthorizedException } from './unauthorized.exception';

describe('UnauthorizedException', () => {
  it('est une instance de GraphQLError', () => {
    expect(new UnauthorizedException()).toBeInstanceOf(GraphQLError);
  });

  it('a le code d\'extension UNAUTHENTICATED', () => {
    const err = new UnauthorizedException();
    expect(err.extensions.code).toBe('UNAUTHENTICATED');
  });

  it('expose un statut HTTP 401', () => {
    const err = new UnauthorizedException();
    expect((err.extensions.http as { status: number }).status).toBe(401);
  });

  it('utilise "Unauthorized" comme message par défaut', () => {
    const err = new UnauthorizedException();
    expect(err.message).toBe('Unauthorized');
  });

  it('accepte un message personnalisé', () => {
    const err = new UnauthorizedException('Accès refusé');
    expect(err.message).toBe('Accès refusé');
  });

  it('a le nom UnauthorizedException', () => {
    const err = new UnauthorizedException();
    expect(err.name).toBe('UnauthorizedException');
  });
});