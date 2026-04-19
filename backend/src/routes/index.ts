import type { FastifyInstance } from "fastify";
import { healthRoutes } from "../modules/health/health.routes";
import { studentsRoutes } from "../modules/students/students.routes";

const registerRoutes = async (app: FastifyInstance) => {
	await app.register(healthRoutes);
	await app.register(studentsRoutes);
};

export { registerRoutes };