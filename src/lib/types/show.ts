// Base interface for common show fields
interface ShowBase {
	id: string;
	title: string;
	description: string;
	genres: string[];
	averageScore: number | null;
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
