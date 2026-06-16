import type { FastifyPluginAsync } from 'fastify'
import { requireRole } from '../../middlewares/role.middleware'
import { listCourses, getCourse, create, update, remove } from './courses.controller'

const coursesRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireRole('admin'))
  app.get('/courses', listCourses)
  app.get('/courses/:id', getCourse)
  app.post('/courses', create)
  app.put('/courses/:id', update)
  app.delete('/courses/:id', remove)
}

export { coursesRoutes }
