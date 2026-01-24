<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	const status = $derived($page.status);
	const message = $derived($page.error?.message ?? 'An unexpected error occurred');
</script>

<svelte:head>
	<title>Error - MyShowList</title>
</svelte:head>

<div class="error-container">
	<div class="error-content">
		<div class="error-icon">
			{#if status === 404}
				🔍
			{:else if status === 401}
				🔒
			{:else}
				⚠️
			{/if}
		</div>

		<h1 class="error-code">{status}</h1>

		<p class="error-message">
			{#if status === 404}
				Show not found
			{:else if status === 401}
				Not authenticated
			{:else}
				Something went wrong
			{/if}
		</p>

		<p class="error-details">{message}</p>

		<div class="error-actions">
			<button onclick={() => goto('/')} class="primary-button"> Go to Home </button>
			<button onclick={() => window.history.back()} class="secondary-button"> Go Back </button>
		</div>
	</div>
</div>

<style>
	.error-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.error-content {
		background: white;
		border-radius: 1rem;
		padding: 3rem 2rem;
		max-width: 500px;
		width: 100%;
		text-align: center;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	.error-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.error-code {
		font-size: 4rem;
		font-weight: 700;
		color: #667eea;
		margin: 0 0 1rem 0;
	}

	.error-message {
		font-size: 1.5rem;
		font-weight: 600;
		color: #2d3748;
		margin: 0 0 1rem 0;
	}

	.error-details {
		color: #718096;
		font-size: 1rem;
		margin: 0 0 2rem 0;
	}

	.error-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.primary-button,
	.secondary-button {
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
	}

	.primary-button {
		background: #667eea;
		color: white;
	}

	.primary-button:hover {
		background: #5568d3;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.secondary-button {
		background: #f7fafc;
		color: #4a5568;
		border: 1px solid #e2e8f0;
	}

	.secondary-button:hover {
		background: #edf2f7;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	@media (max-width: 640px) {
		.error-content {
			padding: 2rem 1.5rem;
		}

		.error-code {
			font-size: 3rem;
		}

		.error-message {
			font-size: 1.25rem;
		}

		.error-actions {
			flex-direction: column;
		}

		.primary-button,
		.secondary-button {
			width: 100%;
		}
	}
</style>
