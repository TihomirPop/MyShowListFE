import type { LoginRequest, LoginResponse, RegisterResponse } from '$lib/types/auth';
import type {
	ShowResponse,
	SingleShowResponse,
	SingleShowResponseOk,
	SingleShowResponseNotFound,
	SingleShowResponseFailure
} from '$lib/types/show';

// Get base URL from environment variable, fallback to relative path for production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class ApiError extends Error {
	constructor(
		message: string,
		public status: number
	) {
		super(message);
		this.name = 'ApiError';
	}
}

async function request<T>(
	endpoint: string,
	options: RequestInit = {},
	token?: string | null
): Promise<T> {
	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	};

	// Add Authorization header if token is provided //todo: don't call the method with it, use the store?
	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	const response = await fetch(`${API_BASE_URL}${endpoint}`, {
		...options,
		headers
	});

	// Handle non-2xx responses
	if (!response.ok) {
		// For 404, don't try to parse JSON body
		if (response.status === 404) {
			throw new ApiError('Not found', response.status);
		}

		// Try to parse error message from JSON
		const contentType = response.headers.get('content-type');
		if (contentType && contentType.includes('application/json')) {
			const data = await response.json();
			throw new ApiError(data.message || 'Request failed', response.status);
		}

		// Non-JSON error response
		throw new ApiError('Request failed', response.status);
	}

	// Parse successful JSON response
	const data = await response.json();

	return data as T;
}

export async function loginAPI(credentials: LoginRequest): Promise<LoginResponse> {
	return request<LoginResponse>('/login', {
		method: 'POST',
		body: JSON.stringify(credentials)
	});
}

export async function registerAPI(credentials: LoginRequest): Promise<RegisterResponse> {
	return request<LoginResponse>('/register', {
		method: 'POST',
		body: JSON.stringify(credentials)
	});
}

// Generic authenticated request helper for future use
export async function authenticatedRequest<T>(
	endpoint: string,
	token: string,
	options: RequestInit = {}
): Promise<T> {
	return request<T>(endpoint, options, token);
}

export async function getShowsAPI(token: string): Promise<ShowResponse> {
	return authenticatedRequest<ShowResponse>('/shows', token, {
		method: 'GET'
	});
}

export async function getShowByIdAPI(
	showId: string,
	token: string
): Promise<SingleShowResponse> {
	try {
		const response = await authenticatedRequest<SingleShowResponseOk>(`/shows/${showId}`, token, {
			method: 'GET'
		});
		return response;
	} catch (error) {
		if (error instanceof ApiError) {
			// 404 Not Found
			if (error.status === 404) {
				return {} as SingleShowResponseNotFound;
			}
			// 500 Server Error or other errors
			return { message: error.message } as SingleShowResponseFailure;
		}
		// Unexpected error
		return {
			message: error instanceof Error ? error.message : 'An unexpected error occurred'
		} as SingleShowResponseFailure;
	}
}
