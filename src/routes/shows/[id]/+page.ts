import { error } from '@sveltejs/kit';
import { authStore } from '$lib/stores/auth.svelte';
import { getShowByIdAPI } from '$lib/api/client';
import {
	isSingleShowOk,
	isSingleShowNotFound,
	isSingleShowFailure
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
	}

	if (isSingleShowNotFound(response)) {
		throw error(404, 'Show not found');
	}

	if (isSingleShowFailure(response)) {
		throw error(500, response.message || 'Failed to load show');
	}

	// Should never reach here due to exhaustive type checking
	throw error(500, 'Unexpected response');
};
