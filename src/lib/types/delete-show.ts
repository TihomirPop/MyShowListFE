// Delete show response types (DOP pattern - sealed interface)
export interface DeleteShowResponseOk {
	// Empty - success indicator (204 No Content)
}

export interface DeleteShowResponseNotFound {
	// Show not found (404)
}

export interface DeleteShowResponseFailure {
	message: string; // 500 or other errors
}

export type DeleteShowResponse =
	| DeleteShowResponseOk
	| DeleteShowResponseNotFound
	| DeleteShowResponseFailure;

// Type guards for DeleteShowResponse
export function isDeleteShowOk(
	response: DeleteShowResponse
): response is DeleteShowResponseOk {
	return !('message' in response);
}

export function isDeleteShowNotFound(
	response: DeleteShowResponse
): response is DeleteShowResponseNotFound {
	return !('message' in response) && Object.keys(response).length === 0;
}

export function isDeleteShowFailure(
	response: DeleteShowResponse
): response is DeleteShowResponseFailure {
	return 'message' in response;
}
