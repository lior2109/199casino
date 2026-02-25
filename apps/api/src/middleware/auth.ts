import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { JwtPayload, UserRole } from '@betpro/shared';

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtPayload;
    tenantId: string;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const decoded = await request.jwtVerify<JwtPayload>();
    request.user = decoded;
    request.tenantId = decoded.tenantId;
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);
    if (reply.sent) return;

    if (!roles.includes(request.user.role)) {
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
        request.tenantId = result.rows[0].id;
      }
    }
  });
}
