import type { FastifyInstance } from "fastify";
import { authRoutes } from "../modules/auth/auth.routes";
import { coursesRoutes } from "../modules/courses/courses.routes";
import { exploreRoutes } from "../modules/explore/explore.routes";
import { filesRoutes } from "../modules/files/files.routes";
import { healthRoutes } from "../modules/health/health.routes";
import { postsRoutes } from "../modules/posts/posts.routes";
import { profileRoutes } from "../modules/profile/profile.routes";
import { searchRoutes } from "../modules/search/search.routes";
import { studentsRoutes } from "../modules/students/students.routes";
import { subjectsRoutes } from "../modules/subjects/subjects.routes";

const registerRoutes = async (app: FastifyInstance) => {
	await app.register(authRoutes);
	await app.register(filesRoutes);
	await app.register(healthRoutes);
	await app.register(postsRoutes);
	await app.register(profileRoutes);
	await app.register(searchRoutes);
	await app.register(studentsRoutes);
	await app.register(subjectsRoutes);
	await app.register(coursesRoutes);
	await app.register(exploreRoutes);
};

export { registerRoutes };
