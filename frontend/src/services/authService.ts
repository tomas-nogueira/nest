import type { AuthCredentials, AuthUser } from '../types/auth';
import { request } from './api';

type AuthPayload = {
	accessToken: string;
	user: AuthUser;
};

type MePayload = {
	user: AuthUser;
};

const signIn = async (credentials: AuthCredentials) => {
	return request<AuthPayload>('/auth/login', {
		method: 'POST',
		body: JSON.stringify(credentials),
	});
};

const signUp = async (data: AuthCredentials & { name: string }) => {
	return request<AuthPayload>('/auth/register', {
		method: 'POST',
		body: JSON.stringify(data),
	});
};

const fetchMe = async (token: string) => {
	return request<MePayload>('/auth/me', {}, token);
};

export { fetchMe, signIn, signUp };
