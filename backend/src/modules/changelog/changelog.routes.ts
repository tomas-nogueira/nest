import type { FastifyPluginAsync } from 'fastify'
import { requireRole } from '../../middlewares/role.middleware'
import { create, list, remove, update } from './changelog.controller'

const changelogRoutes: FastifyPluginAsync = async (app) => {
  app.get('/changelog', list)
  app.post('/changelog', { preHandler: requireRole('admin') }, create)
  app.patch('/changelog/:id', { preHandler: requireRole('admin') }, update)
  app.delete('/changelog/:id', { preHandler: requireRole('admin') }, remove)
}

export { changelogRoutes }
