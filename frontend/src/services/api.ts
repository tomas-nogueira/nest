import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';

type ApiErrorResponse = {
	message?: unknown;
	error?: unknown;
	issues?: Array<{ message?: unknown }>;
};

const FALLBACK_ERROR_MESSAGE = 'Erro inesperado.';

class ApiRequestError extends Error {
	status: number;
	payload?: ApiErrorResponse;
	handled: boolean;

	constructor(message: string, status: number, payload?: ApiErrorResponse) {
		super(message);
		this.name = 'ApiRequestError';
		this.status = status;
		this.payload = payload;
		this.handled = false;
	}
}

const isNonEmptyString = (value: unknown): value is string => {
	return typeof value === 'string' && value.trim().length > 0;
};

const extractMessageFromUnknown = (value: unknown): string | null => {
	if (isNonEmptyString(value)) {
		return value;
	}

	if (Array.isArray(value)) {
		const joined = value
			.map((item) => extractMessageFromUnknown(item))
			.filter((item): item is string => Boolean(item))
			.join(', ');

		return joined || null;
	}

	if (value && typeof value === 'object' && 'message' in value) {
		return extractMessageFromUnknown((value as { message?: unknown }).message);
	}

	return null;
};

const getErrorMessage = (payload?: ApiErrorResponse | null) => {
	if (!payload) {
		return FALLBACK_ERROR_MESSAGE;
	}

	const message =
		extractMessageFromUnknown(payload.message) ??
		extractMessageFromUnknown(payload.error) ??
		extractMessageFromUnknown(payload.issues);

	return message ?? FALLBACK_ERROR_MESSAGE;
};

const notifyApiError = (error: unknown) => {
	if (error instanceof ApiRequestError) {
		if (!error.handled) {
			toast.error(error.message || FALLBACK_ERROR_MESSAGE);
			error.handled = true;
		}
		return;
	}

	if (error instanceof Error) {
		toast.error(error.message || FALLBACK_ERROR_MESSAGE);
		return;
	}

	toast.error(FALLBACK_ERROR_MESSAGE);
};

const request = async <T>(
	path: string,
	options: RequestInit = {},
	token?: string | null,
): Promise<T> => {
	try {
		const headers: Record<string, string> = {};

		if (typeof options.headers === 'object' && options.headers) {
			Object.assign(headers, options.headers as Record<string, string>);
		}

		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}

		if (options.body !== undefined && options.body !== null) {
			headers['Content-Type'] = 'application/json';
		}

		const response = await fetch(`${API_URL}${path}`, {
			...options,
			headers,
		});

		const contentType = response.headers.get('content-type') ?? '';
		const isJson = contentType.includes('application/json');
		const payload = (isJson
			? ((await response.json().catch(() => ({}))) as T & ApiErrorResponse)
			: ((await response.text().catch(() => '')) as unknown as T & ApiErrorResponse));

		if (!response.ok) {
			const message =
				getErrorMessage(typeof payload === 'object' ? (payload as ApiErrorResponse) : undefined) ||
				response.statusText ||
				FALLBACK_ERROR_MESSAGE;
			throw new ApiRequestError(
				message,
				response.status,
				typeof payload === 'object' ? (payload as ApiErrorResponse) : undefined,
			);
		}

		return payload as T;
	} catch (error) {
		notifyApiError(error);
		throw error;
	}
};

export { API_URL, request };