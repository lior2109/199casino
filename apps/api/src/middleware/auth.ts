import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { UserRole } from '@betpro/shared';

export interface RequestUser {
  userId: string;
  tenantId: string;
  role: UserRole;
  username: string;
}

export function getUser(request: FastifyRequest): RequestUser {
  return (request as unknown as { betproUser: RequestUser }).betproUser;
}

function setUser(request: FastifyRequest, user: RequestUser) {
  (request as unknown as { betproUser: RequestUser }).betproUser = user;
}

export function getTenantId(request: FastifyRequest): string {
  return (request as unknown as { betproTenantId: string }).betproTenantId;
}

function setTenantId(request: FastifyRequest, tenantId: string) {
  (request as unknown as { betproTenantId: string }).betproTenantId = tenantId;
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const decoded = await request.jwtVerify() as unknown as RequestUser;
    setUser(request, decoded);
    setTenantId(request, decoded.tenantId);
  } catch (_err) {
    reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);
    if (reply.sent) return;

    const user = getUser(request);
    if (!roles.includes(user.role)) {
      reply.status(403).send({ error: 'Forbidden', message: 'Insufficient permissions' });
    }
  };
}

export function tenantMiddleware(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request: FastifyRequest) => {
    const tenantSlug = request.headers['x-tenant-slug'] as string;
    if (tenantSlug) {
      const result = await fastify.db.query(
        'SELECT id FROM tenants WHERE slug = $1 AND is_active = true',
        [tenantSlug]
      );
      if (result.rows.length > 0) {
        setTenantId(request, result.rows[0].id);
      }
    }
  });
}
