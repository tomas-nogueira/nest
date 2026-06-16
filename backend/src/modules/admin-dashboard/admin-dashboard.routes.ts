import type { FastifyPluginAsync } from "fastify";
import { requireRole } from "../../middlewares/role.middleware";
import { getDashboard } from "./admin-dashboard.controller";

const adminDashboardRoutes: FastifyPluginAsync = async (app) => {
	app.get("/admin/dashboard", { preHandler: requireRole("admin") }, getDashboard);
};

export { adminDashboardRoutes };
