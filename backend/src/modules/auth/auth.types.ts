export type AuthUser = {
	id: string;
	name: string;
	email: string;
	phone: string | null;
	bio: string | null;
	avatarUrl: string | null;
	hype: number;
	course: {
		id: string;
		name: string;
	} | null;
};

export type AuthResponse = {
	accessToken: string;
	user: AuthUser;
};

export type JwtPayload = {
	sub: string;
	email: string;
};
