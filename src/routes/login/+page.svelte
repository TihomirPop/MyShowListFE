<script lang="ts">
	import { authStore } from "$lib/stores/auth.svelte";
	import { goto } from "$app/navigation";
	import type { LoginFormErrors } from "$lib/types/auth";

	let username = $state("");
	let password = $state("");
	let isLoading = $state(false);
	let errors = $state<LoginFormErrors>({});

	function validateForm(): boolean {
		const newErrors: LoginFormErrors = {};

		if (!username || username.trim().length < 3) {
			newErrors.username = "Username must be at least 3 characters";
		}

		if (!password || password.length < 6) {
			newErrors.password = "Password must be at least 6 characters";
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		errors = {};

		if (!validateForm()) {
			return;
		}

		isLoading = true;

		try {
			const result = await authStore.login(username.trim(), password);

			if (result.success) {
				// Redirect to home page on success
				goto("/");
			} else {
				// Show error message
				errors = { general: result.error || "Login failed" };
			}
		} catch (error) {
			errors = {
				general: "An unexpected error occurred. Please try again.",
			};
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Login - MyShowList</title>
</svelte:head>

<div class="login-container">
	<div class="login-card">
		<h1>Welcome to MyShowList</h1>
		<p class="subtitle">Sign in to track your favorite shows</p>

		<form onsubmit={handleSubmit}>
			{#if errors.general}
				<div class="error-banner" role="alert">
					{errors.general}
				</div>
			{/if}

			<div class="form-group">
				<label for="username">Username</label>
				<input
					id="username"
					type="text"
					bind:value={username}
					placeholder="Enter your username"
					disabled={isLoading}
					aria-invalid={!!errors.username}
					aria-describedby={errors.username
						? "username-error"
						: undefined}
				/>
				{#if errors.username}
					<span
						id="username-error"
						class="error-message"
						role="alert"
					>
						{errors.username}
					</span>
				{/if}
			</div>

			<div class="form-group">
				<label for="password">Password</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					placeholder="Enter your password"
					disabled={isLoading}
					aria-invalid={!!errors.password}
					aria-describedby={errors.password
						? "password-error"
						: undefined}
				/>
				{#if errors.password}
					<span
						id="password-error"
						class="error-message"
						role="alert"
					>
						{errors.password}
					</span>
				{/if}
			</div>

			<button type="submit" class="btn-primary" disabled={isLoading}>
				{isLoading ? "Signing in..." : "Sign in"}
			</button>
		</form>

		<p class="register-link">
			Don't have an account? <a href="/register">Register here</a>
		</p>
	</div>
</div>

<style>
	.login-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--gradient-primary);
		padding: var(--space-4);
	}

	.login-card {
		background: var(--color-white);
		padding: var(--space-10);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-xl);
		width: 100%;
		max-width: 420px;
	}

	h1 {
		margin: 0 0 var(--space-2) 0;
		font-size: 1.75rem;
		color: var(--color-dark);
		text-align: center;
	}

	.subtitle {
		margin: 0 0 var(--space-8) 0;
		color: var(--color-gray);
		text-align: center;
		font-size: 0.95rem;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	label {
		font-weight: 600;
		color: var(--color-dark-medium);
		font-size: 0.95rem;
	}

	.error-message {
		color: var(--color-error);
		font-size: var(--font-size-sm);
		margin-top: calc(-1 * var(--space-1));
	}

	.btn-primary {
		margin-top: var(--space-2);
	}

	.register-link {
		text-align: center;
		margin-top: var(--space-6);
		margin-bottom: 0;
		color: var(--color-gray);
		font-size: var(--font-size-sm);
	}

	.register-link a {
		color: var(--color-primary);
		text-decoration: none;
		font-weight: 600;
	}

	.register-link a:hover {
		text-decoration: underline;
	}

	@media (max-width: 480px) {
		.login-card {
			padding: var(--space-8) var(--space-6);
		}

		h1 {
			font-size: var(--font-size-xl);
		}
	}
</style>
