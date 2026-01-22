import { authStore } from '$lib/stores/auth.svelte';
import { redirect } from '@sveltejs/kit';

export const load = () => {
	// If already authenticated, redirect to home
	if (authStore.isAuthenticated) {
		throw redirect(302, '/');
	}

	return {};
};
