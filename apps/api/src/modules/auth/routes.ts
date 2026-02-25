import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcryptjs from 'bcryptjs';
import { authenticate, getUser } from '../../middleware/auth.js';

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email().max(255),
  password: z.string().min(6).max(100),
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  tenant_slug: z.string().optional(),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const tenantSlug = (request.headers['x-tenant-slug'] as string) || body.tenant_slug || 'default';

    const tenantResult = await fastify.db.query(
      'SELECT id, currency FROM tenants WHERE slug = $1 AND is_active = true',
      [tenantSlug]
    );

    if (tenantResult.rows.length === 0) {
      return reply.status(400).send({ error: 'Invalid tenant' });
    }

    const tenant = tenantResult.rows[0];
    const passwordHash = await bcryptjs.hash(body.password, 12);

    const client = await fastify.db.connect();
    try {
      await client.query('BEGIN');

      const userResult = await client.query(
        `INSERT INTO users (tenant_id, username, email, password_hash, first_name, last_name, phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, username, email, role`,
        [tenant.id, body.username, body.email, passwordHash, body.first_name || null, body.last_name || null, body.phone || null]
      );

      const user = userResult.rows[0];

      await client.query(
        'INSERT INTO wallets (user_id, currency) VALUES ($1, $2)',
        [user.id, tenant.currency]
      );

      await client.query('COMMIT');

      const accessToken = fastify.jwt.sign(
        { userId: user.id, tenantId: tenant.id, role: user.role, username: user.username },
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
      );

      const refreshToken = fastify.jwt.sign(
        { userId: user.id, tenantId: tenant.id, role: user.role, username: user.username, type: 'refresh' },
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
      );

      return reply.status(201).send({
        user: { id: user.id, username: user.username, email: user.email, role: user.role },
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      const pgError = error as { code?: string };
      if (pgError.code === '23505') {
        return reply.status(409).send({ error: 'Username or email already exists' });
      }
      throw error;
    } finally {
      client.release();
    }
  });

  fastify.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);

    const result = await fastify.db.query(
      `SELECT u.id, u.username, u.email, u.password_hash, u.role, u.tenant_id, u.is_active
       FROM users u WHERE u.username = $1`,
      [body.username]
    );

    if (result.rows.length === 0) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return reply.status(403).send({ error: 'Account is deactivated' });
    }

    const validPassword = await bcryptjs.compare(body.password, user.password_hash);
    if (!validPassword) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    await fastify.db.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    const accessToken = fastify.jwt.sign(
      { userId: user.id, tenantId: user.tenant_id, role: user.role, username: user.username },
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = fastify.jwt.sign(
      { userId: user.id, tenantId: user.tenant_id, role: user.role, username: user.username, type: 'refresh' },
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return reply.send({
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  });

  fastify.post('/refresh', async (request, reply) => {
    const { refresh_token } = request.body as { refresh_token: string };
    if (!refresh_token) {
      return reply.status(400).send({ error: 'Refresh token required' });
    }

    try {
      const decoded = fastify.jwt.verify(refresh_token) as unknown as { userId: string; tenantId: string; role: string; username: string; type: string };
      if (decoded.type !== 'refresh') {
        return reply.status(401).send({ error: 'Invalid token type' });
      }

      const accessToken = fastify.jwt.sign(
        { userId: decoded.userId, tenantId: decoded.tenantId, role: decoded.role, username: decoded.username },
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
      );

      return reply.send({ access_token: accessToken });
    } catch {
      return reply.status(401).send({ error: 'Invalid refresh token' });
    }
  });

  fastify.post('/logout', { preHandler: [authenticate] }, async (_request, reply) => {
    return reply.send({ message: 'Logged out successfully' });
  });

  fastify.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const result = await fastify.db.query(
      `SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.role, u.tenant_id,
              w.real_balance, w.bonus_balance, w.currency
       FROM users u
       LEFT JOIN wallets w ON w.user_id = u.id
       WHERE u.id = $1`,
      [getUser(request).userId]
    );

    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return reply.send({ user: result.rows[0] });
  });
}
