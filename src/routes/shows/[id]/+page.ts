import { error } from '@sveltejs/kit';
import { authStore } from '$lib/stores/auth.svelte';
import { getShowByIdAPI } from '$lib/api/client';
import {
	isSingleShowOk,
	isSingleShowNotFound,
	isSingleShowFailure,
	type SingleShowResponseFailure
} from '$lib/types/show';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const { id } = params;

	// Check authentication
	if (!authStore.token) {
		throw error(401, 'Not authenticated');
	}

	// Fetch show data
	const response = await getShowByIdAPI(id, authStore.token);

	// Pattern match on response (DOP style)
	if (isSingleShowOk(response)) {
		return {
			show: response.show
		};
	} else if (isSingleShowNotFound(response)) {
		throw error(404, 'Show not found');
	} else {
		// Handle failure case - type assertion needed due to TypeScript narrowing limitations
		const failureResponse = response as SingleShowResponseFailure;
		throw error(500, failureResponse.message || 'Failed to load show');
	}
};
