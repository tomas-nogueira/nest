import type { FastifyPluginAsync } from 'fastify'
import { requireRole } from '../../middlewares/role.middleware'
import { listSubjects, create, update, remove } from './subjects.controller'

const subjectsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireRole('admin'))
  app.get('/subjects', listSubjects)
  app.post('/subjects', create)
  app.put('/subjects/:id', update)
  app.delete('/subjects/:id', remove)
}

export { subjectsRoutes }
