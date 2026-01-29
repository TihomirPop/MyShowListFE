import { ALLOWED_GENRES, type ShowDto } from './show';

// External API response DTOs matching backend structure
interface ExternalShowBase {
	id: string;
	title: string;
	description: string;
	genres: string[];
	averageScore: number;
	thumbnailUrl: string;
}

export interface ExternalTvSeriesDto extends ExternalShowBase {
	type: 'TV_SERIES';
	episodeCount: number;
	startDate: string;
	endDate: string;
}

export interface ExternalMovieDto extends ExternalShowBase {
	type: 'MOVIE';
	releaseDate: string;
}

// Discriminated union for external show types
export type ExternalShowDto = ExternalTvSeriesDto | ExternalMovieDto;

// Sealed interface response types (DOP pattern)
// Note: Backend returns without explicit 'type' field, structure determines type
export interface ExternalSearchResponseOk {
	tvSeries: ExternalTvSeriesDto[];
	movies: ExternalMovieDto[];
}

export interface ExternalSearchResponseFailure {
	message: string;
}

export type ExternalSearchResponse = ExternalSearchResponseOk | ExternalSearchResponseFailure;

// Type guards for pattern matching
export function isExternalSearchOk(
	response: ExternalSearchResponse
): response is ExternalSearchResponseOk {
	return 'tvSeries' in response && 'movies' in response;
}

export function isExternalSearchFailure(
	response: ExternalSearchResponse
): response is ExternalSearchResponseFailure {
	return 'message' in response;
}

// Conversion utility to transform external DTO to ShowDto for ShowForm
export function toShowDto(external: ExternalShowDto): ShowDto {
	// Filter genres to only include those in ALLOWED_GENRES
	const validGenres = external.genres.filter((genre) => ALLOWED_GENRES.includes(genre));

	if (external.type === 'MOVIE') {
		return {
			type: 'MOVIE',
			id: external.id,
			title: external.title,
			description: external.description,
			genres: validGenres,
			averageScore: external.averageScore,
			thumbnailUrl: external.thumbnailUrl,
			releaseDate: external.releaseDate
		};
	} else {
		return {
			type: 'TV_SERIES',
			id: external.id,
			title: external.title,
			description: external.description,
			genres: validGenres,
			averageScore: external.averageScore,
			thumbnailUrl: external.thumbnailUrl,
			episodeCount: external.episodeCount,
			startDate: external.startDate,
			endDate: external.endDate
		};
	}
}
