import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';

type ApiErrorResponse = {
	message?: string | string[];
};

const getErrorMessage = (payload?: ApiErrorResponse | null) => {
	if (!payload?.message) {
		return 'Erro inesperado.';
	}

	if (Array.isArray(payload.message)) {
		return payload.message.filter(Boolean).join(', ') || 'Erro inesperado.';
	}

	if (typeof payload.message === 'string' && payload.message.trim()) {
		return payload.message;
	}

	return 'Erro inesperado.';
};

const request = async <T>(
	path: string,
	options: RequestInit = {},
	token?: string | null,
): Promise<T> => {
	try {
		const response = await fetch(`${API_URL}${path}`, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				...(options.headers ?? {}),
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
		});

		const payload = (await response.json().catch(() => ({}))) as T & ApiErrorResponse;

		if (!response.ok) {
			const message = getErrorMessage(payload);
			toast.error(message);
			const handledError = new Error(message) as Error & { handled?: boolean };
			handledError.handled = true;
			throw handledError;
		}

		return payload as T;
	} catch (error) {
		if (error instanceof Error) {
			const handled = (error as Error & { handled?: boolean }).handled;
			if (!handled) {
				toast.error(error.message || 'Erro inesperado.');
			}
			throw error;
		}

		toast.error('Erro inesperado.');
		throw error;
	}
};

export { API_URL, request };