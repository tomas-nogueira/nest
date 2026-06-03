export type AuthUser = {
	id: string;
	name: string;
	email: string;
	phone: string | null;
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
};
