import { error } from '@sveltejs/kit';
import { authStore } from '$lib/stores/auth.svelte';
import { getShowByIdAPI } from '$lib/api/client';
import {
	isSingleShowOk,
	isSingleShowNotFound,
	isSingleShowFailure,
	type SingleShowResponseOk
} from '$lib/types/show';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const { id } = params;

	// Check authentication
	if (!authStore.token) {
		throw error(401, 'Not authenticated');
	}

	// Check admin role
	if (authStore.user?.role !== 'ADMIN') {
		throw error(403, 'Only administrators can edit shows');
	}

	// Fetch show data
	const response = await getShowByIdAPI(id, authStore.token);

	// Pattern match response
	if (isSingleShowNotFound(response)) {
		throw error(404, 'Show not found');
	}

	if (isSingleShowFailure(response)) {
		// TypeScript narrowing - explicit assertion after guard
		const failureResponse = response as import('$lib/types/show').SingleShowResponseFailure;
		throw error(500, failureResponse.message || 'Failed to load show');
	}

	if (!isSingleShowOk(response)) {
		throw error(500, 'Failed to load show');
	}

	// TypeScript narrowing - explicit assertion
	const show = (response as SingleShowResponseOk).show;

	return { show };
};
