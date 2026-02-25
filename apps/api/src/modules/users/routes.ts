import { FastifyInstance } from 'fastify';
import { requireRole, getUser } from '../../middleware/auth.js';

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [requireRole('admin', 'superadmin')] }, async (request, reply) => {
    const { page = '1', per_page = '20', search } = request.query as Record<string, string>;
    const offset = (parseInt(page) - 1) * parseInt(per_page);

    let query = `
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.role, u.is_active, u.created_at,
             w.real_balance, w.bonus_balance, w.currency
      FROM users u
      LEFT JOIN wallets w ON w.user_id = u.id
      WHERE u.tenant_id = $1`;
    const params: (string | number)[] = [getUser(request).tenantId];

    if (search) {
      query += ` AND (u.username ILIKE $2 OR u.email ILIKE $2 OR u.first_name ILIKE $2)`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(per_page), offset);

    const result = await fastify.db.query(query, params);
    return reply.send({ users: result.rows });
  });
}
