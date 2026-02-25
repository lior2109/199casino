import { FastifyInstance } from 'fastify';
import { authenticate, getUser } from '../../middleware/auth.js';

export async function bonusRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const result = await fastify.db.query(
      'SELECT * FROM bonuses WHERE user_id = $1 ORDER BY created_at DESC',
      [getUser(request).userId]
    );
    return reply.send({ bonuses: result.rows });
  });
}
