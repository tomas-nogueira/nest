import type { FastifyPluginAsync } from 'fastify'
import { listSubjects, create, update, remove } from './subjects.controller'

const subjectsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/subjects', listSubjects)
  app.post('/subjects', create)
  app.put('/subjects/:id', update)
  app.delete('/subjects/:id', remove)
}

export { subjectsRoutes }
