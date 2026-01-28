// Request Types (Polymorphic with type discriminator)

interface UpdateShowRequestBase {
	id: string;
	title: string;
	description: string;
	thumbnailUrl: string;
	genres: string[];
}

export interface UpdateMovieRequest extends UpdateShowRequestBase {
	type: 'MOVIE';
	releaseDate: string; // ISO 8601 date string (YYYY-MM-DD)
}

export interface UpdateTvSeriesRequest extends UpdateShowRequestBase {
	type: 'TV_SERIES';
	episodeCount: number;
	startDate: string; // ISO 8601 date string (YYYY-MM-DD)
	endDate: string; // ISO 8601 date string (YYYY-MM-DD)
}

export type UpdateShowRequest = UpdateMovieRequest | UpdateTvSeriesRequest;

// Response Types (DOP sealed pattern)

export interface UpdateShowResponseSuccess {
	// Empty - success indicator (200 OK)
}

export interface UpdateShowResponseNotFound {
	// Show not found (404)
}

export interface UpdateShowResponseGenresNotFound {
	missingGenres: string[];
}

export interface UpdateShowResponseFailure {
	message: string; // 403, 500, or other errors
}

export type UpdateShowResponse =
	| UpdateShowResponseSuccess
	| UpdateShowResponseNotFound
	| UpdateShowResponseGenresNotFound
	| UpdateShowResponseFailure;

// Type Guards for Pattern Matching

export function isUpdateShowSuccess(
	response: UpdateShowResponse
): response is UpdateShowResponseSuccess {
	return (
		!('message' in response) &&
		!('missingGenres' in response) &&
		Object.keys(response).length === 0
	);
}

export function isUpdateShowNotFound(
	response: UpdateShowResponse
): response is UpdateShowResponseNotFound {
	return (
		!('message' in response) &&
		!('missingGenres' in response) &&
		Object.keys(response).length === 0
	);
}

export function isUpdateShowGenresNotFound(
	response: UpdateShowResponse
): response is UpdateShowResponseGenresNotFound {
	return 'missingGenres' in response;
}

export function isUpdateShowFailure(
	response: UpdateShowResponse
): response is UpdateShowResponseFailure {
	return 'message' in response && !('missingGenres' in response);
}

// Form State Types

export interface UpdateShowFormErrors {
	title?: string;
	description?: string;
	genres?: string;
	releaseDate?: string;
	episodeCount?: string;
	startDate?: string;
	endDate?: string;
	general?: string;
}

export type ShowType = 'MOVIE' | 'TV_SERIES';
