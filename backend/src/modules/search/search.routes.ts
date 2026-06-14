import type { FastifyPluginAsync } from "fastify";
import { index, suggestions } from "./search.controller";

const searchRoutes: FastifyPluginAsync = async (app) => {
	app.get("/search/suggestions", suggestions);
	app.get("/search", index);
};

export { searchRoutes };

