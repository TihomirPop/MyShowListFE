<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { upsertUserShowAPI } from '$lib/api/client';
	import { getAllStatusOptions, validateProgress } from '$lib/utils/user-show';
	import { Status, type UserShowDto } from '$lib/types/user-show';
	import type { ShowDto } from '$lib/types/show';

	// Props
	let {
		showId,
		initialUserShow,
		show,
		onScoreUpdated
	}: {
		showId: string;
		initialUserShow: UserShowDto | null;
		show: ShowDto;
		onScoreUpdated?: () => void;
	} = $props();

	// State
	let userShow = $state<UserShowDto | null>(null);
	let isUpdating = $state(false);
	let updateError = $state<string | null>(null);
	let progressInput = $state('0');
	let progressError = $state<string | null>(null);

	// Initialize state from props
	$effect(() => {
		userShow = initialUserShow;
		if (initialUserShow) {
			progressInput = initialUserShow.progress.toString();
		}
	});

	// Derived state
	const episodeCount = $derived(
		show.type === 'MOVIE' 
		? 1 
		: show.type === 'TV_SERIES' 
		? show.episodeCount 
		: null
	);

	// Event handlers
	async function handleAddToList() {
		if (!authStore.token) return;
		isUpdating = true;
		updateError = null;

		const response = await upsertUserShowAPI(
			{ showId, progress: 0, status: Status.WATCHING, score: 0 },
			authStore.token
		);

		if ('message' in response) {
			updateError = response.message || 'Failed to add show';
		} else {
			userShow = { show, progress: 0, status: Status.WATCHING, score: 0 };
			progressInput = '0';
		}
		isUpdating = false;
	}

	async function handleStatusChange(event: Event) {
		if (!authStore.token || !userShow) return;
		const target = event.target as HTMLSelectElement;
		const newStatus = target.value as Status;

		isUpdating = true;
		updateError = null;

		const response = await upsertUserShowAPI(
			{ showId, progress: userShow.progress, status: newStatus, score: userShow.score },
			authStore.token
		);

		if ('message' in response) {
			updateError = response.message || 'Failed to update status';
			target.value = userShow.status; // Revert on error
		} else {
			userShow = { ...userShow, status: newStatus };
		}
		isUpdating = false;
	}

	async function handleScoreChange(event: Event) {
		if (!authStore.token || !userShow) return;
		const target = event.target as HTMLSelectElement;
		const newScore = parseInt(target.value, 10);

		isUpdating = true;
		updateError = null;

		const response = await upsertUserShowAPI(
			{ showId, progress: userShow.progress, status: userShow.status, score: newScore },
			authStore.token
		);

		if ('message' in response) {
			updateError = response.message || 'Failed to update score';
			target.value = userShow.score.toString(); // Revert on error
		} else {
			userShow = { ...userShow, score: newScore };
			// Notify parent component to refresh show data
			if (onScoreUpdated) {
				onScoreUpdated();
			}
		}
		isUpdating = false;
	}

	async function updateProgress(newProgress: number) {
		if (!authStore.token || !userShow) return;

		isUpdating = true;
		updateError = null;
		progressError = null;

		const response = await upsertUserShowAPI(
			{ showId, progress: newProgress, status: userShow.status, score: userShow.score },
			authStore.token
		);

		if ('message' in response) {
			updateError = response.message || 'Failed to update progress';
			progressInput = userShow.progress.toString(); // Revert on error
		} else {
			userShow = { ...userShow, progress: newProgress };
			progressInput = newProgress.toString();
		}
		isUpdating = false;
	}

	async function handleProgressUpdate(event: KeyboardEvent) {
		if (event.key !== 'Enter' || !userShow) return;

		const validation = validateProgress(progressInput, episodeCount);
		if (!validation.valid) {
			progressError = validation.error ?? null;
			return;
		}

		const newProgress = validation.progress!;
		if (newProgress === userShow.progress) {
			progressError = null;
			return; // No change
		}

		await updateProgress(newProgress);
	}

	async function handleProgressIncrement() {
		if (!userShow) return;

		const newProgress = userShow.progress + 1;
		const validation = validateProgress(newProgress.toString(), episodeCount);

		if (!validation.valid) {
			progressError = validation.error ?? null;
			return;
		}

		await updateProgress(newProgress);
	}

	function handleProgressInput() {
		progressError = null; // Clear error on input
	}
</script>

<!-- User show section -->
<div class="user-show-section">
	{#if userShow === null}
		<!-- Not in list - show Add button -->
		<button class="btn-primary add-to-list-button" onclick={handleAddToList} disabled={isUpdating}>
			{isUpdating ? 'Adding...' : '+ Add to List'}
		</button>
	{:else}
		<!-- In list - show controls -->
		<div class="user-show-controls">
			<div class="control-group">
				<label for="status-select" class="control-label">Status:</label>
				<select
					id="status-select"
					class="status-select"
					value={userShow.status}
					onchange={handleStatusChange}
					disabled={isUpdating}
				>
					{#each getAllStatusOptions() as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</div>

			<div class="control-group">
				<label for="score-select" class="control-label">Score:</label>
				<select
					id="score-select"
					class="score-select"
					value={userShow.score}
					onchange={handleScoreChange}
					disabled={isUpdating}
				>
					<option value={0}>Select</option>
					{#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as score (score)}
						<option value={score}>{score}</option>
					{/each}
				</select>
			</div>

			<div class="control-group">
				<label for="progress-input" class="control-label">Progress:</label>
				<div class="progress-input-wrapper">
					<input
						id="progress-input"
						type="number"
						min="0"
						max={episodeCount ?? undefined}
						class="progress-input"
						class:has-error={progressError !== null}
						bind:value={progressInput}
						onkeydown={handleProgressUpdate}
						oninput={handleProgressInput}
						disabled={isUpdating}
					/>
					<span class="progress-total">/ {episodeCount ?? '?'}</span>
					<button
						class="progress-increment-button"
						onclick={handleProgressIncrement}
						disabled={isUpdating}
						title="Increment by 1"
					>
						+
					</button>
				</div>
				{#if progressError}
					<span class="error-text">{progressError}</span>
				{/if}
			</div>
		</div>
	{/if}

	{#if updateError}
		<div class="update-error">{updateError}</div>
	{/if}
</div>

<style>
	.user-show-section {
		margin-top: var(--space-6);
		padding-top: var(--space-6);
		border-top: 1px solid var(--color-border-light);
	}

	.user-show-controls {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-6);
		align-items: flex-start;
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.control-label {
		font-weight: 600;
		color: var(--color-dark-light);
		font-size: var(--font-size-sm);
	}

	.status-select {
		padding: var(--space-2) var(--space-4);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-sm);
		background: var(--color-white);
		color: var(--color-dark-medium);
		font-size: 0.95rem;
		cursor: pointer;
		transition: border-color var(--transition-base);
		min-width: 180px;
	}

	.status-select:hover:not(:disabled) {
		border-color: var(--color-border);
	}

	.status-select:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: var(--shadow-focus);
	}

	.status-select:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		background: var(--color-bg-light);
	}

	.score-select {
		padding: var(--space-2) var(--space-4);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-sm);
		background: var(--color-white);
		color: var(--color-dark-medium);
		font-size: 0.95rem;
		cursor: pointer;
		transition: border-color var(--transition-base);
		min-width: 120px;
	}

	.score-select:hover:not(:disabled) {
		border-color: var(--color-border);
	}

	.score-select:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: var(--shadow-focus);
	}

	.score-select:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		background: var(--color-bg-light);
	}

	.progress-input-wrapper {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.progress-input {
		width: 80px;
		padding: var(--space-2);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-sm);
		font-size: 0.95rem;
		color: var(--color-dark-medium);
		transition: border-color var(--transition-base);
	}

	.progress-input:hover:not(:disabled) {
		border-color: var(--color-border);
	}

	.progress-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: var(--shadow-focus);
	}

	.progress-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		background: var(--color-bg-light);
	}

	.progress-input.has-error {
		border-color: var(--color-error-border);
	}

	.progress-total {
		color: var(--color-gray);
		font-weight: 500;
	}

	.progress-increment-button {
		width: 32px;
		height: 32px;
		padding: 0;
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-sm);
		background: var(--color-white);
		color: var(--color-primary);
		font-size: var(--font-size-xl);
		font-weight: 700;
		cursor: pointer;
		transition: all var(--transition-base);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.progress-increment-button:hover:not(:disabled) {
		background: var(--color-primary);
		color: var(--color-white);
		border-color: var(--color-primary);
	}

	.progress-increment-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		background: var(--color-bg-light);
	}

	.error-text {
		color: var(--color-error);
		font-size: 0.8rem;
		margin-top: 0.25rem;
	}

	.update-error {
		margin-top: var(--space-4);
		padding: var(--space-3);
		background: var(--color-error-bg);
		border: 1px solid var(--color-error-border);
		border-radius: var(--radius-sm);
		color: var(--color-error);
		font-size: 0.9rem;
	}

	@media (max-width: 768px) {
		.user-show-controls {
			flex-direction: column;
			gap: var(--space-4);
		}

		.status-select,
		.score-select {
			width: 100%;
		}
	}
</style>
