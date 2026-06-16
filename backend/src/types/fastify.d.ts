import type { JwtPayload } from "../modules/auth/auth.types";

declare module "@fastify/jwt" {
	interface FastifyJWT {
		payload: JwtPayload;
		user: JwtPayload;
	}
}