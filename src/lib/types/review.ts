// Review DTO (matches backend)
export interface ReviewDto {
	reviewText: string;
	username: string; // Only in responses, not requests
}

// API request type
export interface ReviewRequest {
	reviewText: string;
}

// Get reviews response types (DOP pattern - sealed interface)
// Backend returns array directly, not wrapped in object
export type GetReviewsResponseOk = ReviewDto[];

export interface GetReviewsResponseNotFound {
	// Show not found
}

export interface GetReviewsResponseFailure {
	message: string;
}

export type GetReviewsResponse =
	| GetReviewsResponseOk
	| GetReviewsResponseNotFound
	| GetReviewsResponseFailure;

// Add/Update review response types (DOP pattern - sealed interface)
export interface ReviewMutationResponseOk {
	// Empty - success indicator
}

export interface ReviewMutationResponseNotFound {
	// User or Show not found
}

export interface ReviewMutationResponseBadRequest {
	message: string; // Validation error
}

export interface ReviewMutationResponseFailure {
	message: string;
}

export type ReviewMutationResponse =
	| ReviewMutationResponseOk
	| ReviewMutationResponseNotFound
	| ReviewMutationResponseBadRequest
	| ReviewMutationResponseFailure;

// Delete review response types (DOP pattern - sealed interface)
export interface DeleteReviewResponseOk {
	// Empty - success indicator
}

export interface DeleteReviewResponseNotFound {
	// Review not found
}

export interface DeleteReviewResponseFailure {
	message: string;
}

export type DeleteReviewResponse =
	| DeleteReviewResponseOk
	| DeleteReviewResponseNotFound
	| DeleteReviewResponseFailure;

// Type guards for GetReviewsResponse
export function isGetReviewsOk(response: GetReviewsResponse): response is GetReviewsResponseOk {
	return Array.isArray(response);
}

export function isGetReviewsNotFound(
	response: GetReviewsResponse
): response is GetReviewsResponseNotFound {
	return !Array.isArray(response) && !('message' in response);
}

export function isGetReviewsFailure(
	response: GetReviewsResponse
): response is GetReviewsResponseFailure {
	return 'message' in response;
}

// Type guards for ReviewMutationResponse
export function isReviewMutationOk(
	response: ReviewMutationResponse
): response is ReviewMutationResponseOk {
	return !('message' in response);
}

export function isReviewMutationNotFound(
	response: ReviewMutationResponse
): response is ReviewMutationResponseNotFound {
	return !('message' in response) && Object.keys(response).length === 0;
}

export function isReviewMutationBadRequest(
	response: ReviewMutationResponse
): response is ReviewMutationResponseBadRequest {
	// Distinguish by HTTP status in API client
	return 'message' in response;
}

export function isReviewMutationFailure(
	response: ReviewMutationResponse
): response is ReviewMutationResponseFailure {
	return 'message' in response;
}

// Type guards for DeleteReviewResponse
export function isDeleteReviewOk(
	response: DeleteReviewResponse
): response is DeleteReviewResponseOk {
	return !('message' in response);
}

export function isDeleteReviewNotFound(
	response: DeleteReviewResponse
): response is DeleteReviewResponseNotFound {
	return !('message' in response) && Object.keys(response).length === 0;
}

export function isDeleteReviewFailure(
	response: DeleteReviewResponse
): response is DeleteReviewResponseFailure {
	return 'message' in response;
}
