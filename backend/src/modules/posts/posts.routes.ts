import type { FastifyPluginAsync } from "fastify";
import {
	destroy as destroyComment,
	index as listComments,
	store as storeComment,
	update as updateComment,
	vote as voteComment,
} from "./comments.controller";
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
	app.get("/posts/:id/comments", listComments);
	app.post("/posts/:id/comments", storeComment);
	app.patch("/posts/:id/comments/:commentId", updateComment);
	app.delete("/posts/:id/comments/:commentId", destroyComment);
	app.put("/posts/:id/comments/:commentId/vote", voteComment);
};

export { postsRoutes };
