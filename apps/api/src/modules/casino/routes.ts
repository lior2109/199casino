import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate, getUser } from '../../middleware/auth.js';

const gamesQuerySchema = z.object({
  search: z.string().optional(),
  producer: z.string().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  has_demo: z.string().optional(),
  page: z.string().optional().default('1'),
  per_page: z.string().optional().default('24'),
});

export async function casinoRoutes(fastify: FastifyInstance) {
  fastify.get('/games', async (request, reply) => {
    const query = gamesQuerySchema.parse(request.query);
    const page = parseInt(query.page);
    const perPage = parseInt(query.per_page);
    const offset = (page - 1) * perPage;

    let sql = 'SELECT * FROM games WHERE is_active = true';
    const params: (string | number | boolean)[] = [];
    let paramIdx = 1;

    if (query.search) {
      sql += ` AND (title ILIKE $${paramIdx} OR producer ILIKE $${paramIdx})`;
      params.push(`%${query.search}%`);
      paramIdx++;
    }

    if (query.producer) {
      sql += ` AND producer = $${paramIdx}`;
      params.push(query.producer);
      paramIdx++;
    }

    if (query.type) {
      sql += ` AND type = $${paramIdx}`;
      params.push(query.type);
      paramIdx++;
    }

    if (query.category) {
      sql += ` AND category = $${paramIdx}`;
      params.push(query.category);
      paramIdx++;
    }

    if (query.has_demo === 'true') {
      sql += ' AND has_demo = true';
    }

    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await fastify.db.query(countSql, params);

    sql += ` ORDER BY title ASC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    params.push(perPage, offset);

    const result = await fastify.db.query(sql, params);

    return reply.send({
      games: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      per_page: perPage,
    });
  });

  fastify.get('/games/producers', async (_request, reply) => {
    const result = await fastify.db.query(
      'SELECT DISTINCT producer FROM games WHERE is_active = true AND producer IS NOT NULL ORDER BY producer'
    );
    return reply.send({ producers: result.rows.map(r => r.producer) });
  });

  fastify.post('/games/sync', { preHandler: [authenticate] }, async (request, reply) => {
    const user = getUser(request);
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return reply.status(403).send({ error: 'Admin access required' });
    }

    try {
      const apiUrl = process.env.GAMEHUB_API_URL;
      const apiToken = process.env.GAMEHUB_API_TOKEN;

      const response = await fetch(`${apiUrl}/games`, {
        headers: { 'Authorization': `Bearer ${apiToken}`, 'Accept': 'application/json' },
      });

      if (!response.ok) {
        fastify.log.error('Game sync failed: %d', response.status);
        return reply.status(502).send({ error: 'Failed to fetch games from provider' });
      }

      const data = await response.json() as { data?: Array<Record<string, unknown>> };
      const games = data.data || [];

      let synced = 0;
      for (const game of games) {
        await fastify.db.query(
          `INSERT INTO games (id, title, producer, category, type, image_url, horizontal_image_url, vertical_image_url,
            currencies_supported, countries_supported, has_demo, has_freespins, has_bonusbuy, has_jackpots, last_synced_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
           ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title, producer = EXCLUDED.producer, category = EXCLUDED.category,
            type = EXCLUDED.type, image_url = EXCLUDED.image_url, last_synced_at = NOW()`,
          [
            game.id, game.title, game.producer, game.category, game.type,
            game.image_url, game.horizontal_image_url, game.vertical_image_url,
            JSON.stringify(game.currencies_supported || []),
            JSON.stringify(game.countries_supported || []),
            game.has_demo || false, game.has_freespins || false,
            game.has_bonusbuy || false, game.has_jackpots || false,
          ]
        );
        synced++;
      }

      return reply.send({ message: `Synced ${synced} games` });
    } catch (error) {
      fastify.log.error({ err: error }, 'Game sync error');
      return reply.status(500).send({ error: 'Game sync failed' });
    }
  });

  fastify.post('/sessions', { preHandler: [authenticate] }, async (request, reply) => {
    const { game_id } = request.body as { game_id: number };

    if (!game_id) {
      return reply.status(400).send({ error: 'game_id is required' });
    }

    const gameResult = await fastify.db.query('SELECT * FROM games WHERE id = $1 AND is_active = true', [game_id]);
    if (gameResult.rows.length === 0) {
      return reply.status(404).send({ error: 'Game not found' });
    }

    const sessionUser = getUser(request);
    const walletResult = await fastify.db.query('SELECT currency FROM wallets WHERE user_id = $1', [sessionUser.userId]);
    const currency = walletResult.rows[0]?.currency || 'ILS';

    try {
      const apiUrl = process.env.GAMEHUB_API_URL;
      const apiToken = process.env.GAMEHUB_API_TOKEN;

      const response = await fetch(`${apiUrl}/game-sessions/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          game_id,
          player_id: sessionUser.userId,
          currency,
          return_url: process.env.FRONTEND_URL || 'http://localhost:3000',
          ip_address: request.ip,
          country_code: 'IL',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        fastify.log.error('Game session start failed: %d %s', response.status, errorText);
        return reply.status(502).send({ error: 'Failed to start game session' });
      }

      const data = await response.json() as { iframe_url?: string; url?: string };
      return reply.send({ iframe_url: data.iframe_url || data.url });
    } catch (error) {
      fastify.log.error({ err: error }, 'Game session error');
      return reply.status(500).send({ error: 'Failed to start game session' });
    }
  });
}
