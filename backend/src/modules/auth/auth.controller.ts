import type { FastifyReply, FastifyRequest } from 'fastify';
import { loginSchema, registerSchema } from './auth.schemas';
import { getAuthenticatedUser, loginStudent, registerStudent } from './auth.service';
import type { JwtPayload } from './auth.types';

const handleAuthError = (error: unknown, reply: FastifyReply) => {
	if (!(error instanceof Error)) {
		throw error;
	}

	switch (error.message) {
		case 'E-mail já cadastrado.':
			return reply.code(409).send({ message: error.message });
		case 'Credenciais inválidas.':
			return reply.code(401).send({ message: error.message });
		case 'Usuário não encontrado.':
			return reply.code(404).send({ message: error.message });
		default:
			throw error;
	}
};

const login = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const body = loginSchema.parse(request.body);
		const auth = await loginStudent(body, reply.jwtSign.bind(reply));

		return reply.send(auth);
	} catch (error) {
		return handleAuthError(error, reply);
	}
};

const register = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const body = registerSchema.parse(request.body);
		const auth = await registerStudent(body, reply.jwtSign.bind(reply));

		return reply.code(201).send(auth);
	} catch (error) {
		return handleAuthError(error, reply);
	}
};

const me = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		await request.jwtVerify();
		const payload = request.user as JwtPayload;
		const user = await getAuthenticatedUser(payload.sub);

		return reply.send({ user });
	} catch (error) {
		return handleAuthError(error, reply);
	}
};

export { login, register, me };
