// Base interface for common show fields
interface ShowBase {
	id: string;
	title: string;
	description: string;
	genres: string[];
	averageScore: number | null;
	thumbnailUrl: string;
}

// Movie-specific type with discriminator
export interface MovieDto extends ShowBase {
	type: 'MOVIE';
	releaseDate: string;
}

// TV Series-specific type with discriminator
export interface TvSeriesDto extends ShowBase {
	type: 'TV_SERIES';
	episodeCount: number | null;
	startDate: string | null;
	endDate: string | null;
}

// Union type for polymorphic ShowDto (discriminated union)
export type ShowDto = MovieDto | TvSeriesDto;

// API response types matching backend sealed interface pattern
export interface ShowResponseOk {
	shows: ShowDto[];
}

export interface ShowResponseFailure {
	message: string;
}

export type ShowResponse = ShowResponseOk | ShowResponseFailure;

// Single show API response types (DOP pattern - sealed interface)
export interface SingleShowResponseOk {
	show: ShowDto;
}

export interface SingleShowResponseNotFound {
	// Empty - just indicates not found
}

export interface SingleShowResponseFailure {
	message: string;
}

export type SingleShowResponse =
	| SingleShowResponseOk
	| SingleShowResponseNotFound
	| SingleShowResponseFailure;

// Type guards for discriminating SingleShowResponse types
export function isSingleShowOk(response: SingleShowResponse): response is SingleShowResponseOk {
	return 'show' in response;
}

export function isSingleShowNotFound(
	response: SingleShowResponse
): response is SingleShowResponseNotFound {
	return !('show' in response) && !('message' in response);
}

export function isSingleShowFailure(
	response: SingleShowResponse
): response is SingleShowResponseFailure {
	return 'message' in response;
}
