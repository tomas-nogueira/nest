import type { FastifyReply, FastifyRequest } from "fastify";
import { getAdminDashboard } from "./admin-dashboard.service";
import type { AdminDashboardPeriod } from "./admin-dashboard.service";

const allowedPeriods = new Set<AdminDashboardPeriod>([7, 14, 30]);

const parsePeriod = (value: unknown): AdminDashboardPeriod => {
	const period = Number(value ?? 30);
	return allowedPeriods.has(period as AdminDashboardPeriod) ? (period as AdminDashboardPeriod) : 30;
};

const getDashboard = async (request: FastifyRequest, reply: FastifyReply) => {
	const query = request.query as { periodDays?: string; courseId?: string };
	const periodDays = parsePeriod(query.periodDays);
	const courseId = typeof query.courseId === "string" && query.courseId.trim() ? query.courseId.trim() : undefined;

	const dashboard = await getAdminDashboard({ periodDays, courseId });
	return reply.send(dashboard);
};

export { getDashboard };
