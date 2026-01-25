import { error } from '@sveltejs/kit';
import { authStore } from '$lib/stores/auth.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	// Check authentication
	if (!authStore.token || !authStore.user) {
		throw error(401, 'Not authenticated');
	}

	// Check admin role
	if (authStore.user.role !== 'ADMIN') {
		throw error(403, 'You do not have permission to access this page');
	}

	// Return empty data (no data fetching needed for this page)
	return {};
};
