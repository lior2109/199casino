import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireRole } from '../../middleware/auth.js';

const createTenantSchema = z.object({
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(100),
  domain: z.string().max(255).optional(),
  currency: z.string().length(3).default('ILS'),
  language: z.string().max(5).default('he'),
  primary_color: z.string().max(7).default('#00e5ff'),
  secondary_color: z.string().max(7).default('#f5c842'),
});

export async function tenantRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [requireRole('superadmin')] }, async (_request, reply) => {
    const result = await fastify.db.query('SELECT * FROM tenants ORDER BY created_at DESC');
    return reply.send({ tenants: result.rows });
  });

  fastify.post('/', { preHandler: [requireRole('superadmin')] }, async (request, reply) => {
    const body = createTenantSchema.parse(request.body);
    const result = await fastify.db.query(
      `INSERT INTO tenants (slug, name, domain, currency, language, primary_color, secondary_color)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [body.slug, body.name, body.domain, body.currency, body.language, body.primary_color, body.secondary_color]
    );
    return reply.status(201).send({ tenant: result.rows[0] });
  });

  fastify.get('/by-slug/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const result = await fastify.db.query(
      'SELECT id, slug, name, domain, logo_url, primary_color, secondary_color, currency, language FROM tenants WHERE slug = $1 AND is_active = true',
      [slug]
    );
    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'Tenant not found' });
    }
    return reply.send({ tenant: result.rows[0] });
  });
}
