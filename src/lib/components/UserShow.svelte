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
		<button class="add-to-list-button" onclick={handleAddToList} disabled={isUpdating}>
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
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e2e8f0;
	}

	.add-to-list-button {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
	}

	.add-to-list-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
	}

	.add-to-list-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.user-show-controls {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
		align-items: flex-start;
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.control-label {
		font-weight: 600;
		color: #4a5568;
		font-size: 0.875rem;
	}

	.status-select {
		padding: 0.5rem 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: white;
		color: #2d3748;
		font-size: 0.95rem;
		cursor: pointer;
		transition: border-color 0.2s;
		min-width: 180px;
	}

	.status-select:hover:not(:disabled) {
		border-color: #cbd5e0;
	}

	.status-select:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.status-select:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		background: #f7fafc;
	}

	.score-select {
		padding: 0.5rem 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: white;
		color: #2d3748;
		font-size: 0.95rem;
		cursor: pointer;
		transition: border-color 0.2s;
		min-width: 120px;
	}

	.score-select:hover:not(:disabled) {
		border-color: #cbd5e0;
	}

	.score-select:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.score-select:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		background: #f7fafc;
	}

	.progress-input-wrapper {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.progress-input {
		width: 80px;
		padding: 0.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		font-size: 0.95rem;
		color: #2d3748;
		transition: border-color 0.2s;
	}

	.progress-input:hover:not(:disabled) {
		border-color: #cbd5e0;
	}

	.progress-input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.progress-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		background: #f7fafc;
	}

	.progress-input.has-error {
		border-color: #fc8181;
	}

	.progress-total {
		color: #718096;
		font-weight: 500;
	}

	.progress-increment-button {
		width: 32px;
		height: 32px;
		padding: 0;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: white;
		color: #667eea;
		font-size: 1.25rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.progress-increment-button:hover:not(:disabled) {
		background: #667eea;
		color: white;
		border-color: #667eea;
	}

	.progress-increment-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		background: #f7fafc;
	}

	.error-text {
		color: #c53030;
		font-size: 0.8rem;
		margin-top: 0.25rem;
	}

	.update-error {
		margin-top: 1rem;
		padding: 0.75rem;
		background: #fff5f5;
		border: 1px solid #fc8181;
		border-radius: 0.375rem;
		color: #c53030;
		font-size: 0.9rem;
	}

	@media (max-width: 768px) {
		.user-show-controls {
			flex-direction: column;
			gap: 1rem;
		}

		.status-select,
		.score-select {
			width: 100%;
		}
	}
</style>
