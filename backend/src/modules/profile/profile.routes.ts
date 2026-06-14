import type { FastifyPluginAsync } from "fastify";
import { comments, posts, show, showByStudent, update, votes } from "./profile.controller";

const profileRoutes: FastifyPluginAsync = async (app) => {
	app.get("/profile/me", show);
	app.patch("/profile/me", update);
	app.get("/profile/:studentId", showByStudent);
	app.get("/profile/:studentId/posts", posts);
	app.get("/profile/:studentId/votes", votes);
	app.get("/profile/:studentId/comments", comments);
};

export { profileRoutes };
