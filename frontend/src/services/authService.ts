import type { AuthCredentials, AuthUser } from '../types/auth';
import { request } from './api';

type AuthPayload = {
	accessToken: string;
	user: AuthUser;
};

type FormattedAuthResponse = AuthPayload & {
	message: string;
};

type MePayload = {
	user: AuthUser;
};

type AuthRegisterData = AuthCredentials & {
	name: string;
	courseId: string;
};

const getFirstName = (name: string) => {
	const [firstName] = name.trim().split(/\s+/);
	return firstName || 'estudante';
};

const signIn = async (credentials: AuthCredentials) => {
	const payload = await request<AuthPayload>('/auth/login', {
		method: 'POST',
		body: JSON.stringify(credentials),
	});

	return {
		...payload,
		message: `Login realizado com sucesso. Bem-vindo, ${getFirstName(payload.user.name)}!`,
	} satisfies FormattedAuthResponse;
};

const signUp = async (data: AuthRegisterData) => {
	const payload = await request<AuthPayload>('/auth/register', {
		method: 'POST',
		body: JSON.stringify(data),
	});

	return {
		...payload,
		message: `Conta criada com sucesso. Bem-vindo, ${getFirstName(payload.user.name)}!`,
	} satisfies FormattedAuthResponse;
};

const fetchMe = async (token: string) => {
	return request<MePayload>('/auth/me', {}, token);
};

export { fetchMe, signIn, signUp };
