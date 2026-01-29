<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { getUserShowsAPI } from '$lib/api/client';
	import type { UserShowDto } from '$lib/types/user-show';
	import { isGetUserShowsOk } from '$lib/types/user-show';
	import { formatScore, getPlaceholderGradient } from '$lib/utils/show';
	import { getStatusLabel, getProgressDisplay, getStatusColor } from '$lib/utils/user-show';
	import { onMount } from 'svelte';

	let userShows = $state<UserShowDto[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let imageErrors = $state<Map<string, boolean>>(new Map());
	let sortField = $state<'averageScore' | 'date' | 'score'>('score');
	let sortDirection = $state<'asc' | 'desc'>('desc');

	const showCount = $derived(userShows.length);

	function handleImageError(showId: string) {
		const newErrors = new Map(imageErrors);
		newErrors.set(showId, true);
		imageErrors = newErrors;
	}

	function sortUserShows(
		userShows: UserShowDto[],
		field: 'averageScore' | 'date' | 'score',
		direction: 'asc' | 'desc'
	): UserShowDto[] {
		const sorted = [...userShows]; // Shallow copy to avoid mutation

		sorted.sort((a, b) => {
			let compareResult: number;

			if (field === 'averageScore') {
				// Handle null scores - push to end
				if (a.show.averageScore === null && b.show.averageScore === null) return 0;
				if (a.show.averageScore === null) return 1;
				if (b.show.averageScore === null) return -1;

				compareResult = a.show.averageScore - b.show.averageScore;
			} else if (field === 'date') {
				// field === 'date'
				// Extract date based on discriminated union type
				const dateA = a.show.type === 'MOVIE' ? a.show.releaseDate : a.show.startDate;
				const dateB = b.show.type === 'MOVIE' ? b.show.releaseDate : b.show.startDate;

				// Handle null dates - push to end
				if (dateA === null && dateB === null) return 0;
				if (dateA === null) return 1;
				if (dateB === null) return -1;

				// Parse ISO date strings and compare
				const timeA = new Date(dateA).getTime();
				const timeB = new Date(dateB).getTime();

				compareResult = timeA - timeB;
			} else {
				// field === 'score'
				compareResult = a.score - b.score;
			}

			// Apply direction multiplier
			return direction === 'asc' ? compareResult : -compareResult;
		});

		return sorted;
	}

	const sortedUserShows = $derived(sortUserShows(userShows, sortField, sortDirection));

	onMount(async () => {
		await loadUserShows();
	});

	async function loadUserShows() {
		if (!authStore.token) {
			error = 'Not authenticated';
			isLoading = false;
			return;
		}

		isLoading = true;
		error = null;

		try {
			const response = await getUserShowsAPI(authStore.token);

			if (isGetUserShowsOk(response)) {
				userShows = response.shows;
			} else if ('message' in response) {
				error = response.message;
			} else {
				// NotFound response - treat as empty list
				userShows = [];
			}
		} catch (err) {
			if (err instanceof Error) {
				error = err.message;
			} else {
				error = 'An unexpected error occurred';
			}
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>My List - MyShowList</title>
</svelte:head>

<div class="container">
	<div class="hero">
		<h1>My List</h1>
		<p class="hero-text">Track your watching progress and manage your shows</p>
	</div>

	<section class="shows-section">
		<h2>Your Shows {#if showCount > 0}<span class="show-count">({showCount})</span>{/if}</h2>

		<div class="controls-section">
			<div class="control-group">
				<label for="sort-field">Sort by:</label>
				<select
					id="sort-field"
					bind:value={sortField}
					disabled={isLoading}
					aria-label="Sort shows by"
				>
					<option value="score">Your Score</option>
					<option value="averageScore">Average Score</option>
					<option value="date">Release Date</option>
				</select>
			</div>

			<button
				type="button"
				class="sort-direction-btn"
				onclick={() => (sortDirection = sortDirection === 'asc' ? 'desc' : 'asc')}
				disabled={isLoading}
				aria-label="Toggle sort direction"
				title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
			>
				{sortDirection === 'asc' ? '↑' : '↓'}
				<span class="direction-label"
					>{sortDirection === 'asc' ? 'Ascending' : 'Descending'}</span
				>
			</button>
		</div>

		{#if isLoading}
			<div class="loading-container">
				<div class="loading-spinner"></div>
				<p>Loading your shows...</p>
			</div>
		{:else if error}
			<div class="error-banner">
				{error}
			</div>
			<div style="text-align: center; margin-top: 1rem;">
				<button onclick={loadUserShows} class="btn-primary">Try Again</button>
			</div>
		{:else if userShows.length === 0}
			<div class="empty-state">
				<div class="empty-icon">📺</div>
				<p>Your list is empty!</p>
				<p class="hint">Start adding shows to track your watching progress.</p>
				<a href="/" class="browse-button">Browse Shows</a>
			</div>
		{:else}
			<div class="shows-grid">
				{#each sortedUserShows as userShow, index (userShow.show.id)}
					<a href="/shows/{userShow.show.id}" class="show-card-link">
						<article class="user-show-card">
							<div class="show-thumbnail">
								{#if !imageErrors.get(userShow.show.id) && userShow.show.thumbnailUrl}
									<img
										src={userShow.show.thumbnailUrl}
										alt="{userShow.show.title} poster"
										class="thumbnail-image"
										onerror={() => handleImageError(userShow.show.id)}
									/>
								{:else}
									<div
										class="thumbnail-placeholder"
										style="background: {getPlaceholderGradient(index)};"
									></div>
								{/if}
								<span class="show-type-badge">{userShow.show.type === 'MOVIE' ? 'Movie' : 'TV'}</span>
								<span
									class="status-badge"
									style="background-color: {getStatusColor(userShow.status).bg}; color: {getStatusColor(userShow.status).text};"
								>
									{getStatusLabel(userShow.status)}
								</span>
							</div>
							<div class="show-info">
								<h3>{userShow.show.title}</h3>
								<div class="scores-row">
									<div class="show-score">
										<span class="score-icon">⭐</span>
										<span class="score-value">{formatScore(userShow.show.averageScore)}</span>
									</div>
									{#if userShow.score > 0}
										<div class="user-score">
											<span class="score-icon">👤</span>
											<span class="score-value">{userShow.score}/10</span>
										</div>
									{/if}
								</div>
								<div class="progress-indicator">
									{getProgressDisplay(userShow)}
								</div>
								{#if userShow.show.genres.length > 0}
									<div class="show-genres">
										{userShow.show.genres.slice(0, 3).join(' • ')}
									</div>
								{/if}
							</div>
						</article>
					</a>
				{/each}
			</div>
		{/if}
	</section>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--space-8) var(--space-6);
	}

	.hero {
		text-align: center;
		margin-bottom: var(--space-12);
		padding: var(--space-8) 0;
	}

	h1 {
		margin: 0 0 var(--space-4) 0;
		font-size: var(--font-size-3xl);
		color: var(--color-dark);
		font-weight: 700;
	}

	.hero-text {
		font-size: var(--font-size-xl);
		color: var(--color-gray);
		margin: 0;
	}

	.shows-section {
		margin-bottom: var(--space-12);
	}

	.shows-section h2 {
		margin: 0 0 var(--space-6) 0;
		font-size: 1.75rem;
		color: var(--color-dark);
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.show-count {
		font-size: var(--font-size-xl);
		color: var(--color-gray);
		font-weight: 400;
	}

	.controls-section {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		margin-bottom: var(--space-6);
		flex-wrap: wrap;
	}

	.control-group {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.control-group label {
		font-weight: 600;
		color: var(--color-dark-medium);
		font-size: 0.95rem;
		white-space: nowrap;
	}

	.control-group select {
		min-width: 180px;
	}

	.sort-direction-btn {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		background: var(--color-white);
		color: var(--color-dark-medium);
		border: 1px solid var(--color-border);
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-md);
		font-size: var(--font-size-base);
		font-weight: 600;
		cursor: pointer;
		transition: all var(--transition-base);
	}

	.sort-direction-btn:hover:not(:disabled) {
		background: var(--color-bg-light);
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.sort-direction-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.direction-label {
		font-size: 0.9rem;
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: var(--space-4);
	}

	.empty-state p {
		margin: var(--space-2) 0;
		color: var(--color-gray);
		font-size: 1.1rem;
	}

	.empty-state .hint {
		font-size: 0.95rem;
		color: var(--color-gray-light);
		margin-bottom: var(--space-6);
	}

	.browse-button {
		display: inline-block;
		background: var(--gradient-primary);
		color: var(--color-white);
		padding: var(--space-3) var(--space-6);
		border-radius: var(--radius-md);
		text-decoration: none;
		font-weight: 600;
		transition: all var(--transition-base);
	}

	.browse-button:hover {
		opacity: 0.9;
		transform: translateY(-1px);
		box-shadow: var(--shadow-md);
	}

	.shows-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: var(--space-6);
	}

	.show-card-link {
		text-decoration: none;
		color: inherit;
		display: block;
	}

	.user-show-card {
		background: var(--color-white);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
		transition: transform var(--transition-base), box-shadow var(--transition-base);
		overflow: hidden;
		height: 100%;
	}

	.show-card-link:hover .user-show-card {
		transform: translateY(-4px);
		box-shadow: var(--shadow-lg);
	}

	.show-thumbnail {
		width: 100%;
		aspect-ratio: 2 / 3;
		position: relative;
		overflow: hidden;
	}

	.thumbnail-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.thumbnail-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.show-type-badge {
		position: absolute;
		top: var(--space-3);
		left: var(--space-3);
		background: rgba(255, 255, 255, 0.9);
		color: var(--color-dark-medium);
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.025em;
		z-index: 1;
	}

	.status-badge {
		position: absolute;
		top: var(--space-3);
		right: var(--space-3);
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: capitalize;
		letter-spacing: 0.025em;
		z-index: 1;
	}

	.show-info {
		padding: var(--space-5);
	}

	.show-info h3 {
		margin: 0 0 var(--space-3) 0;
		font-size: var(--font-size-lg);
		color: var(--color-dark-medium);
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.scores-row {
		display: flex;
		gap: var(--space-4);
		align-items: center;
		margin-bottom: var(--space-2);
	}

	.show-score {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.score-icon {
		font-size: var(--font-size-lg);
	}

	.score-value {
		font-weight: 600;
		color: var(--color-primary);
		font-size: var(--font-size-base);
	}

	.user-score {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.user-score .score-icon {
		font-size: var(--font-size-base);
	}

	.user-score .score-value {
		font-weight: 600;
		color: var(--color-dark-light);
		font-size: var(--font-size-sm);
	}

	.progress-indicator {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--font-size-sm);
		color: var(--color-gray);
		margin-top: var(--space-2);
		font-weight: 500;
	}

	.show-genres {
		font-size: var(--font-size-sm);
		color: var(--color-gray);
		margin-top: var(--space-2);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	@media (max-width: 768px) {
		.container {
			padding: var(--space-6) var(--space-4);
		}

		h1 {
			font-size: var(--font-size-2xl);
		}

		.hero-text {
			font-size: 1.1rem;
		}

		.shows-section h2 {
			font-size: var(--font-size-xl);
		}

		.controls-section {
			flex-direction: column;
			align-items: stretch;
			gap: var(--space-4);
		}

		.control-group {
			width: 100%;
		}

		.control-group select {
			flex: 1;
			min-width: 0;
		}

		.sort-direction-btn {
			width: 100%;
			justify-content: center;
		}

		.shows-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
