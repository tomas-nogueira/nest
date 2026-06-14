import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import type { AuthActionResult, AuthContextValue, AuthCredentials, AuthRegisterData, AuthUser } from '../types/auth';
import { fetchMe, signIn as signInRequest, signUp as signUpRequest } from '../services/authService';

const AUTH_STORAGE_KEY = 'nest-backup:auth-session';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
	children: ReactNode;
};

const loadStoredUser = () => {
	const raw = localStorage.getItem(AUTH_STORAGE_KEY);

	if (!raw) {
		return null;
	}

	try {
		return JSON.parse(raw) as { user: AuthUser; accessToken: string };
	} catch {
		return null;
	}
};

const AuthProvider = ({ children }: AuthProviderProps) => {
	const [storedSession] = useState(() => loadStoredUser());
	const [user, setUser] = useState<AuthUser | null>(storedSession?.user ?? null);
	const [accessToken, setAccessToken] = useState<string | null>(storedSession?.accessToken ?? null);
	const [isLoading, setIsLoading] = useState(Boolean(storedSession?.accessToken));

	useEffect(() => {
		const loadSession = async () => {
			if (!storedSession?.accessToken) {
				setIsLoading(false);
				return;
			}

			setIsLoading(true);

			try {
				const response = await fetchMe(storedSession.accessToken);
				setUser(response.user);
				setAccessToken(storedSession.accessToken);
			} catch {
				setUser(null);
				setAccessToken(null);
				localStorage.removeItem(AUTH_STORAGE_KEY);
			} finally {
				setIsLoading(false);
			}
		};

		void loadSession();
	}, [storedSession]);

	useEffect(() => {
		if (!user || !accessToken) {
			localStorage.removeItem(AUTH_STORAGE_KEY);
			return;
		}

		localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, accessToken }));
	}, [user, accessToken]);

	const signIn = async (credentials: AuthCredentials) => {
		setIsLoading(true);

		try {
			const response = await signInRequest(credentials);
			setUser(response.user);
			setAccessToken(response.accessToken);
			toast.success(response.message);
			return { message: response.message } satisfies AuthActionResult;
		} finally {
			setIsLoading(false);
		}
	};

	const signUp = async (data: AuthRegisterData) => {
		setIsLoading(true);

		try {
			const response = await signUpRequest(data);
			setUser(response.user);
			setAccessToken(response.accessToken);
			toast.success(response.message);
			return { message: response.message } satisfies AuthActionResult;
		} finally {
			setIsLoading(false);
		}
	};

	const signOut = () => {
		setUser(null);
		setAccessToken(null);
		localStorage.removeItem(AUTH_STORAGE_KEY);
	};

	const value = useMemo<AuthContextValue>(
		() => ({
			user,
			accessToken,
			isAuthenticated: Boolean(user),
			isLoading,
			signIn,
			signUp,
			signOut,
		}),
		[user, accessToken, isLoading],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext, AuthProvider };
