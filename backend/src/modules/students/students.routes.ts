import type { FastifyPluginAsync } from "fastify";
import { getStudentsCount } from "./students.controller";

const studentsRoutes: FastifyPluginAsync = async (app) => {
	app.get("/students/count", getStudentsCount);
};

export { studentsRoutes };