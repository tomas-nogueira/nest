import type { FastifyPluginAsync } from "fastify";
import { index } from "./explore.controller";

const exploreRoutes: FastifyPluginAsync = async (app) => {
	app.get("/explore", index);
};

export { exploreRoutes };
