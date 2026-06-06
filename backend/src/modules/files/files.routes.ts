import type { FastifyPluginAsync } from "fastify";
import { destroy, show, upload } from "./files.controller";

const filesRoutes: FastifyPluginAsync = async (app) => {
	app.post("/files", upload);
	app.get("/files/:id", show);
	app.delete("/files/:id", destroy);
};

export { filesRoutes };
