import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth.js';

export async function walletRoutes(fastify: FastifyInstance) {
  fastify.get('/balance', { preHandler: [authenticate] }, async (request, reply) => {
    const result = await fastify.db.query(
      'SELECT real_balance, bonus_balance, locked_balance, currency FROM wallets WHERE user_id = $1',
      [request.user.userId]
    );

    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'Wallet not found' });
    }

    const wallet = result.rows[0];
    return reply.send({
      real_balance: wallet.real_balance,
      bonus_balance: wallet.bonus_balance,
      locked_balance: wallet.locked_balance,
      currency: wallet.currency,
      total_balance: (parseFloat(wallet.real_balance) + parseFloat(wallet.bonus_balance)).toFixed(2),
    });
  });

  fastify.get('/transactions', { preHandler: [authenticate] }, async (request, reply) => {
    const { page = '1', per_page = '20', type } = request.query as Record<string, string>;
    const offset = (parseInt(page) - 1) * parseInt(per_page);

    let query = 'SELECT * FROM transactions WHERE user_id = $1';
    const params: (string | number)[] = [request.user.userId];

    if (type) {
      query += ' AND type = $2';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(per_page), offset);

    const result = await fastify.db.query(query, params);

    const countResult = await fastify.db.query(
      'SELECT COUNT(*) FROM transactions WHERE user_id = $1',
      [request.user.userId]
    );

    return reply.send({
      transactions: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      per_page: parseInt(per_page),
    });
  });
}
