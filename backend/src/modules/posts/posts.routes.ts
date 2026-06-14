import type { FastifyPluginAsync } from "fastify";
import { destroy, filters, index, show, store, subjects, update, vote } from "./posts.controller";

const postsRoutes: FastifyPluginAsync = async (app) => {
	app.get("/posts/subjects", subjects);
	app.get("/posts/filters", filters);
	app.get("/posts", index);
	app.get("/posts/:id", show);
	app.post("/posts", store);
	app.patch("/posts/:id", update);
	app.delete("/posts/:id", destroy);
	app.put("/posts/:id/vote", vote);
};

export { postsRoutes };
