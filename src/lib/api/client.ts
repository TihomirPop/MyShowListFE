import type { LoginRequest, LoginResponse, RegisterResponse } from '$lib/types/auth';
import type { ShowResponse } from '$lib/types/show';

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

	// Handle non-JSON responses
	const contentType = response.headers.get('content-type');
	if (!contentType || !contentType.includes('application/json')) {
		throw new ApiError('Server returned non-JSON response', response.status);
	}

	const data = await response.json();

	if (!response.ok) {
		throw new ApiError(data.message || 'Request failed', response.status);
	}

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
