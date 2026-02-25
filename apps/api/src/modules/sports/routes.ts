import { FastifyInstance } from 'fastify';

export async function sportsRoutes(fastify: FastifyInstance) {
  fastify.get('/events', async (_request, reply) => {
    return reply.send({
      events: [],
      message: 'Sports data API integration pending — abstraction layer ready',
    });
  });

  fastify.get('/odds/:eventId', async (request, reply) => {
    const { eventId } = request.params as { eventId: string };
    return reply.send({
      event_id: eventId,
      odds: [],
      message: 'Sports odds API integration pending',
    });
  });
}
