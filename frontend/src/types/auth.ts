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

export type AuthContextValue = {
	user: AuthUser | null;
	accessToken: string | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	signIn: (credentials: AuthCredentials) => Promise<void>;
	signUp: (data: AuthCredentials & { name: string }) => Promise<void>;
	signOut: () => void;
};
