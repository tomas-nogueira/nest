import Fastify from "fastify";
import { prisma } from "./lib/prisma";
import { registerRoutes } from "./routes";

const app = Fastify({ logger: true });

app.register(registerRoutes);

app.addHook("onClose", async () => {
	await prisma.$disconnect();
});

export { app };