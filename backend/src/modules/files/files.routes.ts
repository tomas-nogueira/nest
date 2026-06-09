import type { FastifyPluginAsync } from "fastify";
import { destroy, download, preview, show, upload } from "./files.controller";

const filesRoutes: FastifyPluginAsync = async (app) => {
	app.post("/files", upload);
	app.get("/files/:id", show);
	app.get("/files/:id/preview", preview);
	app.get("/files/:id/download", download);
	app.delete("/files/:id", destroy);
};

export { filesRoutes };
