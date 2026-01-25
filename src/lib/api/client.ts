import type { LoginRequest, LoginResponse, RegisterResponse } from '$lib/types/auth';
import type {
	ShowResponse,
	SingleShowResponse,
	SingleShowResponseOk,
	SingleShowResponseNotFound,
	SingleShowResponseFailure
} from '$lib/types/show';
import type {
	GetReviewsResponse,
	GetReviewsResponseOk,
	GetReviewsResponseNotFound,
	GetReviewsResponseFailure,
	ReviewMutationResponse,
	ReviewMutationResponseOk,
	ReviewMutationResponseNotFound,
	ReviewMutationResponseBadRequest,
	ReviewMutationResponseFailure,
	DeleteReviewResponse,
	DeleteReviewResponseOk,
	DeleteReviewResponseNotFound,
	DeleteReviewResponseFailure,
	ReviewRequest
} from '$lib/types/review';
import type {
	GetUserShowsResponse,
	GetUserShowsResponseOk,
	GetUserShowsResponseNotFound,
	GetUserShowsResponseFailure,
	UpsertUserShowResponse,
	UpsertUserShowResponseOk,
	UpsertUserShowResponseNotFound,
	UpsertUserShowResponseBadRequest,
	UpsertUserShowResponseFailure,
	UpsertUserShowRequest
} from '$lib/types/user-show';
import type {
	CreateShowRequest,
	CreateShowResponse,
	CreateShowResponseSuccess,
	CreateShowResponseGenresNotFound,
	CreateShowResponseFailure
} from '$lib/types/create-show';

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

	// Handle 204 No Content (DELETE success) or 200 with no body
	if (response.status === 204) {
		return {} as T; // Return empty object for void responses
	}

	// Check if response has content before parsing JSON
	const contentType = response.headers.get('content-type');
	if (!contentType || !contentType.includes('application/json')) {
		// Response has no JSON body (e.g., 200 OK with empty body)
		return {} as T;
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

/**
 * Fetch all reviews for a show (requires authentication)
 */
export async function getReviewsAPI(showId: string, token: string): Promise<GetReviewsResponse> {
	try {
		const response = await authenticatedRequest<GetReviewsResponseOk>(
			`/shows/${showId}/reviews`,
			token,
			{
				method: 'GET'
			}
		);
		return response;
	} catch (error) {
		if (error instanceof ApiError) {
			if (error.status === 404) {
				return {} as GetReviewsResponseNotFound;
			}
			return { message: error.message } as GetReviewsResponseFailure;
		}
		return {
			message: error instanceof Error ? error.message : 'An unexpected error occurred'
		} as GetReviewsResponseFailure;
	}
}

/**
 * Add or update a review (authenticated)
 */
export async function addOrUpdateReviewAPI(
	showId: string,
	reviewText: string,
	token: string
): Promise<ReviewMutationResponse> {
	try {
		// Backend accepts both POST and PUT for upsert
		await authenticatedRequest<void>(`/shows/${showId}/reviews`, token, {
			method: 'POST',
			body: JSON.stringify({ reviewText } as ReviewRequest)
		});
		return {} as ReviewMutationResponseOk;
	} catch (error) {
		if (error instanceof ApiError) {
			if (error.status === 404) {
				return {} as ReviewMutationResponseNotFound;
			}
			if (error.status === 400) {
				return { message: error.message } as ReviewMutationResponseBadRequest;
			}
			return { message: error.message } as ReviewMutationResponseFailure;
		}
		return {
			message: error instanceof Error ? error.message : 'An unexpected error occurred'
		} as ReviewMutationResponseFailure;
	}
}

/**
 * Delete a review (authenticated)
 */
export async function deleteReviewAPI(
	showId: string,
	token: string
): Promise<DeleteReviewResponse> {
	try {
		// Backend returns 204 No Content on success
		await authenticatedRequest<void>(`/shows/${showId}/reviews`, token, {
			method: 'DELETE'
		});
		return {} as DeleteReviewResponseOk;
	} catch (error) {
		if (error instanceof ApiError) {
			if (error.status === 404) {
				return {} as DeleteReviewResponseNotFound;
			}
			return { message: error.message } as DeleteReviewResponseFailure;
		}
		return {
			message: error instanceof Error ? error.message : 'An unexpected error occurred'
		} as DeleteReviewResponseFailure;
	}
}

/**
 * Fetch all user shows for the authenticated user
 */
export async function getUserShowsAPI(token: string): Promise<GetUserShowsResponse> {
	try {
		const response = await authenticatedRequest<GetUserShowsResponseOk>('/user-shows', token, {
			method: 'GET'
		});
		return response;
	} catch (error) {
		if (error instanceof ApiError) {
			if (error.status === 404) {
				return {} as GetUserShowsResponseNotFound;
			}
			return { message: error.message } as GetUserShowsResponseFailure;
		}
		return {
			message: error instanceof Error ? error.message : 'An unexpected error occurred'
		} as GetUserShowsResponseFailure;
	}
}

/**
 * Add or update a user show (authenticated)
 */
export async function upsertUserShowAPI(
	request: UpsertUserShowRequest,
	token: string
): Promise<UpsertUserShowResponse> {
	try {
		await authenticatedRequest<void>('/user-shows', token, {
			method: 'POST',
			body: JSON.stringify(request)
		});
		return {} as UpsertUserShowResponseOk;
	} catch (error) {
		if (error instanceof ApiError) {
			if (error.status === 404) {
				return {} as UpsertUserShowResponseNotFound;
			}
			if (error.status === 400) {
				return { message: error.message } as UpsertUserShowResponseBadRequest;
			}
			return { message: error.message } as UpsertUserShowResponseFailure;
		}
		return {
			message: error instanceof Error ? error.message : 'An unexpected error occurred'
		} as UpsertUserShowResponseFailure;
	}
}

/**
 * Create a new show (Movie or TV Series) - Admin only
 */
export async function createShowAPI(
	request: CreateShowRequest,
	token: string
): Promise<CreateShowResponse> {
	try {
		const response = await fetch(`${API_BASE_URL}/shows`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify(request)
		});

		// Handle 201 Created (success)
		if (response.status === 201) {
			// Extract show ID from Location header
			const location = response.headers.get('Location');
			if (!location) {
				return {
					message: 'Show created but Location header not found'
				} as CreateShowResponseFailure;
			}

			// Split by '/' and filter out empty strings, then get the last segment
			const segments = location.split('/').filter((s) => s.length > 0);
			const showId = segments[segments.length - 1];

			if (!showId) {
				return {
					message: 'Show created but could not extract ID from Location header'
				} as CreateShowResponseFailure;
			}

			return { showId } as CreateShowResponseSuccess;
		}

		// Handle 400 Bad Request (genres not found or validation error)
		if (response.status === 400) {
			const data = await response.json();
			const message = data.message || 'Validation failed';

			// Parse missing genres from message
			if (message.startsWith('Genres not found:')) {
				const genresString = message.replace('Genres not found:', '').trim();
				const missingGenres = genresString.split(',').map((g: string) => g.trim());
				return { missingGenres } as CreateShowResponseGenresNotFound;
			}

			// Other validation errors
			return { message } as CreateShowResponseFailure;
		}

		// Handle 403 Forbidden (not admin)
		if (response.status === 403) {
			return {
				message: 'You do not have permission to create shows'
			} as CreateShowResponseFailure;
		}

		// Handle 500 Internal Server Error
		if (response.status === 500) {
			const data = await response.json();
			return { message: data.message || 'Server error' } as CreateShowResponseFailure;
		}

		// Unexpected status code
		return {
			message: `Unexpected response: ${response.status}`
		} as CreateShowResponseFailure;
	} catch (error) {
		// Network error or other unexpected error
		return {
			message: error instanceof Error ? error.message : 'An unexpected error occurred'
		} as CreateShowResponseFailure;
	}
}
