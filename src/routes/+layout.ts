import { authStore } from '$lib/stores/auth.svelte';
import { browser } from '$app/environment';

// Disable SSR and prerendering for client-side authentication
export const ssr = false;
export const prerender = false;