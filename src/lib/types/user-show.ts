import type { ShowDto } from './show';

// Status enum matching backend (API format: lowercase with spaces)
export enum Status {
	WATCHING = 'watching',
	COMPLETED = 'completed',
	ON_HOLD = 'on hold',
	DROPPED = 'dropped',
	PLAN_TO_WATCH = 'plan to watch'
}

// UserShowDto (matches backend response)
export interface UserShowDto {
	show: ShowDto;
	progress: number;
	status: string;
	score: number; // 0 for not rated, 1-10 for rated
}

// Request type for upsert
export interface UpsertUserShowRequest {
	showId: string;
	progress: number;
	status: string;
	score: number;
}

// Get user shows response types (DOP sealed interface pattern)
export interface GetUserShowsResponseOk {
	shows: UserShowDto[];
}

export interface GetUserShowsResponseNotFound {}

export interface GetUserShowsResponseFailure {
	message: string;
}

export type GetUserShowsResponse =
	| GetUserShowsResponseOk
	| GetUserShowsResponseNotFound
	| GetUserShowsResponseFailure;

// Upsert response types (DOP pattern)
export interface UpsertUserShowResponseOk {}

export interface UpsertUserShowResponseNotFound {}

export interface UpsertUserShowResponseBadRequest {
	message: string;
}

export interface UpsertUserShowResponseFailure {
	message: string;
}

export type UpsertUserShowResponse =
	| UpsertUserShowResponseOk
	| UpsertUserShowResponseNotFound
	| UpsertUserShowResponseBadRequest
	| UpsertUserShowResponseFailure;

// Type guards for GetUserShowsResponse
export function isGetUserShowsOk(
	response: GetUserShowsResponse
): response is GetUserShowsResponseOk {
	return 'shows' in response && Array.isArray(response.shows);
}

// Type guards for UpsertUserShowResponse
export function isUpsertUserShowOk(
	response: UpsertUserShowResponse
): response is UpsertUserShowResponseOk {
	return !('message' in response) && Object.keys(response).length === 0;
}
