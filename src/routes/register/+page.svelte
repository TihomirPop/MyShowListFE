<script lang="ts">
	import { authStore } from "$lib/stores/auth.svelte";
	import { goto } from "$app/navigation";
	import type { RegisterFormErrors } from "$lib/types/auth";

	let username = $state("");
	let password = $state("");
	let confirmPassword = $state("");
	let isLoading = $state(false);
	let errors = $state<RegisterFormErrors>({});

	function validateForm(): boolean {
		const newErrors: RegisterFormErrors = {};

		if (!username || username.trim().length < 3) {
			newErrors.username = "Username must be at least 3 characters";
		}

		if (!password || password.length < 6) {
			newErrors.password = "Password must be at least 6 characters";
		}

		if (confirmPassword != password) {
			newErrors.confirmPassword = "Passwords must match";
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
			const result = await authStore.register(username.trim(), password);

			if (result.success) {
				// Redirect to login page on success
				goto("/login");
			} else {
				// Show error message
				errors = { general: result.error || "Register failed" };
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
	<title>Register - MyShowList</title>
</svelte:head>

<div class="register-container">
	<div class="register-card">
		<h1>Welcome to MyShowList</h1>
		<p class="subtitle">Register to track your favorite shows</p>

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

			<div class="form-group">
				<label for="confirmPassword">Password</label>
				<input
					id="confirmPassword"
					type="password"
					bind:value={confirmPassword}
					placeholder="Confirm your password"
					disabled={isLoading}
					aria-invalid={!!errors.confirmPassword}
					aria-describedby={errors.confirmPassword
						? "confirm-password-error"
						: undefined}
				/>
				{#if errors.confirmPassword}
					<span
						id="confirm-password-error"
						class="error-message"
						role="alert"
					>
						{errors.confirmPassword}
					</span>
				{/if}
			</div>

			<button type="submit" disabled={isLoading}>
				{isLoading ? "Registering..." : "Register"}
			</button>
		</form>

		<p class="login-link">
			Already have an account? <a href="/login">Login here</a>
		</p>
	</div>
</div>

<style>
	.register-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 1rem;
	}

	.register-card {
		background: white;
		padding: 2.5rem;
		border-radius: 1rem;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		width: 100%;
		max-width: 420px;
	}

	h1 {
		margin: 0 0 0.5rem 0;
		font-size: 1.75rem;
		color: #1a202c;
		text-align: center;
	}

	.subtitle {
		margin: 0 0 2rem 0;
		color: #718096;
		text-align: center;
		font-size: 0.95rem;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.error-banner {
		background: #fed7d7;
		color: #c53030;
		padding: 0.875rem;
		border-radius: 0.5rem;
		font-size: 0.9rem;
		border: 1px solid #fc8181;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		font-weight: 600;
		color: #2d3748;
		font-size: 0.95rem;
	}

	input {
		padding: 0.75rem 1rem;
		border: 1px solid #cbd5e0;
		border-radius: 0.5rem;
		font-size: 1rem;
		transition: all 0.2s;
		font-family: inherit;
	}

	input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	input[aria-invalid="true"] {
		border-color: #fc8181;
	}

	input:disabled {
		background: #f7fafc;
		cursor: not-allowed;
	}

	.error-message {
		color: #c53030;
		font-size: 0.85rem;
		margin-top: -0.25rem;
	}

	button {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 0.875rem 1.5rem;
		border: none;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
		margin-top: 0.5rem;
	}

	button:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	button:active:not(:disabled) {
		transform: translateY(0);
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.login-link {
		text-align: center;
		margin-top: 1.5rem;
		margin-bottom: 0;
		color: #718096;
		font-size: 0.9rem;
	}

	.login-link a {
		color: #667eea;
		text-decoration: none;
		font-weight: 600;
	}

	.login-link a:hover {
		text-decoration: underline;
	}

	@media (max-width: 480px) {
		.register-card {
			padding: 2rem 1.5rem;
		}

		h1 {
			font-size: 1.5rem;
		}
	}
</style>
