// Request Types (Polymorphic with type discriminator)

interface CreateShowRequestBase {
	title: string;
	description: string;
	thumbnailUrl: string;
	genres: string[];
}

export interface CreateMovieRequest extends CreateShowRequestBase {
	type: 'MOVIE';
	releaseDate: string; // ISO 8601 date string (YYYY-MM-DD)
}

export interface CreateTvSeriesRequest extends CreateShowRequestBase {
	type: 'TV_SERIES';
	episodeCount: number;
	startDate: string; // ISO 8601 date string (YYYY-MM-DD)
	endDate: string; // ISO 8601 date string (YYYY-MM-DD)
}

export type CreateShowRequest = CreateMovieRequest | CreateTvSeriesRequest;

// Response Types (DOP sealed pattern)

export interface CreateShowResponseSuccess {
	showId: string;
}

export interface CreateShowResponseGenresNotFound {
	missingGenres: string[];
}

export interface CreateShowResponseFailure {
	message: string;
}

export type CreateShowResponse =
	| CreateShowResponseSuccess
	| CreateShowResponseGenresNotFound
	| CreateShowResponseFailure;

// Type Guards for Pattern Matching

export function isCreateShowSuccess(
	response: CreateShowResponse
): response is CreateShowResponseSuccess {
	return 'showId' in response;
}

export function isCreateShowGenresNotFound(
	response: CreateShowResponse
): response is CreateShowResponseGenresNotFound {
	return 'missingGenres' in response;
}

export function isCreateShowFailure(
	response: CreateShowResponse
): response is CreateShowResponseFailure {
	return 'message' in response && !('missingGenres' in response);
}

// Form State Types

export interface CreateShowFormErrors {
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
