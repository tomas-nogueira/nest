import type { FastifyPluginAsync } from 'fastify'
import { requireRole } from '../../middlewares/role.middleware'
import { listCourses, getCourse, create, update, remove } from './courses.controller'

const coursesRoutes: FastifyPluginAsync = async (app) => {
  app.get('/courses', listCourses)
  app.get('/courses/:id', getCourse)
  app.post('/courses', { preHandler: requireRole('admin') }, create)
  app.put('/courses/:id', { preHandler: requireRole('admin') }, update)
  app.delete('/courses/:id', { preHandler: requireRole('admin') }, remove)
}

export { coursesRoutes }
