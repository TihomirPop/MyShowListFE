import { error } from '@sveltejs/kit';
import { authStore } from '$lib/stores/auth.svelte';
import { getShowByIdAPI, getUserShowsAPI } from '$lib/api/client';
import {
	isSingleShowOk,
	isSingleShowNotFound,
	isSingleShowFailure,
	type SingleShowResponseOk
} from '$lib/types/show';
import { isGetUserShowsOk, type UserShowDto } from '$lib/types/user-show';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const { id } = params;

	// Check authentication
	if (!authStore.token) {
		throw error(401, 'Not authenticated');
	}

	// Fetch show and user shows in parallel
	const [showResponse, userShowsResponse] = await Promise.all([
		getShowByIdAPI(id, authStore.token),
		getUserShowsAPI(authStore.token)
	]);

	// Pattern match show response
	if (isSingleShowNotFound(showResponse)) {
		throw error(404, 'Show not found');
	}

	if (isSingleShowFailure(showResponse)) {
		throw error(500, (showResponse as { message: string }).message || 'Failed to load show');
	}

	if (!isSingleShowOk(showResponse)) {
		throw error(500, 'Failed to load show');
	}

	// TypeScript narrowing limitation - explicitly assert the type after guards
	const show = (showResponse as SingleShowResponseOk).show;

	// Extract user show for this specific show (may be null)
	let userShow: UserShowDto | null = null;
	if (isGetUserShowsOk(userShowsResponse)) {
		const foundUserShow = userShowsResponse.shows.find((us: UserShowDto) => us.show.id === id);
		userShow = foundUserShow ?? null;
	}

	return {
		show,
		userShow // null if show not in user's list
	};
};
