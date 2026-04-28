const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';

type ApiErrorResponse = {
	message?: string;
};

const request = async <T>(
	path: string,
	options: RequestInit = {},
	token?: string | null,
): Promise<T> => {
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
		throw new Error(payload.message ?? 'Falha na requisição.');
	}

	return payload as T;
};

export { API_URL, request };