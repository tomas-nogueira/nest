import type { FastifyPluginAsync } from 'fastify'
import { requireRole } from '../../middlewares/role.middleware'
import { listCourses, getCourse, create, profile, profileHighlights, profileMedia, profilePosts, remove, update, updateProfile } from './courses.controller'

const coursesRoutes: FastifyPluginAsync = async (app) => {
  app.get('/courses', listCourses)
  app.get('/courses/:id/profile', profile)
  app.get('/courses/:id/profile/posts', profilePosts)
  app.get('/courses/:id/profile/media', profileMedia)
  app.get('/courses/:id/profile/highlights', profileHighlights)
  app.patch('/courses/:id/profile', { preHandler: requireRole('admin') }, updateProfile)
  app.get('/courses/:id', getCourse)
  app.post('/courses', { preHandler: requireRole('admin') }, create)
  app.put('/courses/:id', { preHandler: requireRole('admin') }, update)
  app.delete('/courses/:id', { preHandler: requireRole('admin') }, remove)
}

export { coursesRoutes }
