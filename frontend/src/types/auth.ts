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

export type AuthCredentials = {
	email: string;
	password: string;
};

export type AuthActionResult = {
	message: string;
};

export type AuthContextValue = {
	user: AuthUser | null;
	accessToken: string | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	signIn: (credentials: AuthCredentials) => Promise<AuthActionResult>;
	signUp: (data: AuthCredentials & { name: string }) => Promise<AuthActionResult>;
	signOut: () => void;
	updateUser: (user: AuthUser) => void;
};
