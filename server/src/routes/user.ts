import type { FastifyInstance } from 'fastify';

export async function userRoutes(app: FastifyInstance): Promise<void> {
  // Protected route — requires auth
  app.get(
    '/api/v1/me',
    { preHandler: [app.authenticate] },
    async (request, _reply) => {
      return {
        userId: request.userId,
        email: request.userEmail,
      };
    },
  );
}
