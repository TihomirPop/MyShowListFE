import { loginAPI, registerAPI } from '$lib/api/client';
import type { User } from '$lib/types/auth';
import { goto } from '$app/navigation';

const TOKEN_KEY = 'auth_token';

// Decode JWT to extract username, role and check expiration
function decodeJWT(token: string): { username: string; role: string } | null {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) return null;

		const payload = JSON.parse(atob(parts[1]));

		// Check expiration
		if (payload.exp && payload.exp * 1000 < Date.now()) {
			return null;
		}

		// Extract both username and role
		if (!payload.sub || !payload.role) {
			return null;
		}

		return { username: payload.sub, role: payload.role };
	} catch {
		return null;
	}
}

class AuthStore {
	user = $state<User | null>(null);
	token = $state<string | null>(null);

	get isAuthenticated(): boolean {
		return this.user !== null && this.token !== null;
	}

	async login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
		try {
			const response = await loginAPI({ username, password });

			if (!response.token) {
				// Error case with message
				return { success: false, error: response.message || 'Login failed' };
			}
			// Success case
			this.token = response.token;
			localStorage.setItem(TOKEN_KEY, response.token);

			// Decode JWT to get user info
			const decoded = decodeJWT(response.token);
			if (!decoded) {
				// Token invalid or expired
				this.logout();
				return { success: false, error: 'Invalid token received' };
			}

			this.user = { username: decoded.username, role: decoded.role };
			return { success: true };

		} catch (error) {
			if (error instanceof Error) {
				return { success: false, error: error.message };
			}
			return { success: false, error: 'An unexpected error occurred' };
		}
	}

	logout(): void {
		this.user = null;
		this.token = null;
		localStorage.removeItem(TOKEN_KEY);
		goto('/login');
	}

	initAuth(): void {
		// Restore session from localStorage
		const storedToken = localStorage.getItem(TOKEN_KEY);

		if (storedToken) {
			const decoded = decodeJWT(storedToken);
			if (decoded) {
				this.token = storedToken;
				this.user = { username: decoded.username, role: decoded.role };
			} else {
				// Token invalid or expired
				localStorage.removeItem(TOKEN_KEY);
			}
		}
	}

	async register(username: string, password: string): Promise<{ success: boolean; error?: string }> {
		try {
			const response = await registerAPI({ username, password });

			if (response.message) {
				// Error case with message
				return { success: false, error: response.message || 'Register failed' };
			}

			// Success case
			return { success: true };

		} catch (error) {
			if (error instanceof Error) {
				return { success: false, error: error.message };
			}
			return { success: false, error: 'An unexpected error occurred' };
		}
	}

}

export const authStore = new AuthStore();
