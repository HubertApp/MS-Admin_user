import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GqlThrottlerGuard } from './gql-throttler.guard';

// Instantiation sans appeler le constructeur parent (ThrottlerGuard)
// car getRequestResponse n'utilise aucune propriété initialisée par le parent.
function makeGuard(): GqlThrottlerGuard {
  return Object.create(GqlThrottlerGuard.prototype) as GqlThrottlerGuard;
}

describe('GqlThrottlerGuard', () => {
  afterEach(() => jest.restoreAllMocks());

  it('retourne req et res extraits du contexte GraphQL', () => {
    const req = { headers: {} };
    const res = { header: jest.fn() };

    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => ({ req, res }),
    } as any);

    const result = makeGuard().getRequestResponse({} as ExecutionContext);

    expect(result.req).toBe(req);
    expect(result.res).toBe(res);
  });

  it('utilise noopRes quand Apollo ne fournit pas de res', () => {
    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => ({ req: {}, res: undefined }),
    } as any);

    const { res } = makeGuard().getRequestResponse({} as ExecutionContext);

    expect(res).toBeDefined();
    // noopRes doit être chaînable pour ne pas crasher ThrottlerGuard
    expect((res as any).header()).toBe(res);
    expect((res as any).setHeader()).toBe(res);
  });

  it('noopRes est chainable sur plusieurs appels', () => {
    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => ({ req: {}, res: null }),
    } as any);

    const { res } = makeGuard().getRequestResponse({} as ExecutionContext);

    expect((res as any).header().setHeader().header()).toBeDefined();
  });
});
