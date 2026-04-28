import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import type { AuthResponse, AuthUser, JwtPayload } from "./auth.types";
import { authUserSelect } from "./auth.schemas";

type RegisterInput = {
	name: string;
	email: string;
	password: string;
	phone?: string;
};

type LoginInput = {
	email: string;
	password: string;
};

type JwtSigner = {
	(payload: JwtPayload): Promise<string>;
};

const mapUser = (student: {
	id: string;
	name: string;
	email: string;
	phone: string | null;
}): AuthUser => ({
	id: student.id,
	name: student.name,
	email: student.email,
	phone: student.phone,
});

const buildAuthResponse = async (
	student: {
		id: string;
		name: string;
		email: string;
		phone: string | null;
	},
	signToken: JwtSigner,
): Promise<AuthResponse> => {
	const accessToken = await signToken({ sub: student.id, email: student.email });

	return {
		accessToken,
		user: mapUser(student),
	};
};

const registerStudent = async (input: RegisterInput, signToken: JwtSigner) => {
	const existingStudent = await prisma.student.findUnique({
		where: { email: input.email },
	});

	if (existingStudent) {
		throw new Error("E-mail já cadastrado.");
	}

	const passwordHash = await bcrypt.hash(input.password, 10);

	const student = await prisma.student.create({
		data: {
			name: input.name,
			email: input.email,
			passwordHash,
			phone: input.phone,
		},
		select: authUserSelect,
	});

	return buildAuthResponse(student, signToken);
};

const loginStudent = async (input: LoginInput, signToken: JwtSigner) => {
	const student = await prisma.student.findUnique({
		where: { email: input.email },
	});

	if (!student) {
		throw new Error("Credenciais inválidas.");
	}

	const isPasswordValid = await bcrypt.compare(input.password, student.passwordHash);

	if (!isPasswordValid) {
		throw new Error("Credenciais inválidas.");
	}

	return buildAuthResponse(
		{
			id: student.id,
			name: student.name,
			email: student.email,
			phone: student.phone,
		},
		signToken,
	);
};

const getAuthenticatedUser = async (studentId: string) => {
	const student = await prisma.student.findUnique({
		where: { id: studentId },
		select: authUserSelect,
	});

	if (!student) {
		throw new Error("Usuário não encontrado.");
	}

	return mapUser(student);
};

export { registerStudent, loginStudent, getAuthenticatedUser };
