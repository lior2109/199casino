import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import dbPlugin from './plugins/db.js';
import redisPlugin from './plugins/redis.js';
import { authRoutes } from './modules/auth/routes.js';
import { walletRoutes } from './modules/wallet/routes.js';
import { casinoRoutes } from './modules/casino/routes.js';
import { webhookRoutes } from './modules/webhooks/routes.js';
import { cashierRoutes } from './modules/cashier/routes.js';
import { tenantRoutes } from './modules/tenants/routes.js';
import { userRoutes } from './modules/users/routes.js';
import { bonusRoutes } from './modules/bonus/routes.js';
import { sportsRoutes } from './modules/sports/routes.js';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '../../../.env') });

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  },
});

async function start() {
  await fastify.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'dev-secret',
  });

  await fastify.register(dbPlugin);
  await fastify.register(redisPlugin);

  fastify.setErrorHandler((error, request, reply) => {
    if (error.validation) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: error.message,
        details: error.validation,
      });
    }

    if (error.name === 'ZodError') {
      return reply.status(400).send({
        error: 'Validation Error',
        message: 'Invalid input',
        details: JSON.parse(error.message),
      });
    }

    fastify.log.error(error);
    return reply.status(error.statusCode || 500).send({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    });
  });

  fastify.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(walletRoutes, { prefix: '/api/wallet' });
  await fastify.register(casinoRoutes, { prefix: '/api/casino' });
  await fastify.register(webhookRoutes, { prefix: '/api/webhooks' });
  await fastify.register(cashierRoutes, { prefix: '/api/cashier' });
  await fastify.register(tenantRoutes, { prefix: '/api/tenants' });
  await fastify.register(userRoutes, { prefix: '/api/users' });
  await fastify.register(bonusRoutes, { prefix: '/api/bonus' });
  await fastify.register(sportsRoutes, { prefix: '/api/sports' });

  const port = parseInt(process.env.API_PORT || '3001');
  await fastify.listen({ port, host: '0.0.0.0' });
  fastify.log.info(`BetPro API running on port ${port}`);
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
