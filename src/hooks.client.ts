import { authStore } from '$lib/stores/auth.svelte';
import type { ServerInit } from '@sveltejs/kit';

export const init: ServerInit = async () => {
	await authStore.initAuth();
};