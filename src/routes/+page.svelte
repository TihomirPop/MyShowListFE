<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { getShowsAPI } from '$lib/api/client';
	import type { ShowDto } from '$lib/types/show';
	import { formatScore, getPlaceholderGradient } from '$lib/utils/show';
	import { onMount } from 'svelte';

	let shows = $state<ShowDto[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let imageErrors = $state<Map<string, boolean>>(new Map());
	let sortField = $state<'averageScore' | 'date'>('averageScore');
	let sortDirection = $state<'asc' | 'desc'>('desc');
	let searchQuery = $state('');

	function handleImageError(showId: string) {
		const newErrors = new Map(imageErrors);
		newErrors.set(showId, true);
		imageErrors = newErrors;
	}

	function filterShows(shows: ShowDto[], query: string): ShowDto[] {
		if (!query.trim()) {
			return shows; // No filtering if search is empty
		}

		const lowerQuery = query.toLowerCase();

		return shows.filter((show) => {
			// Search in title
			if (show.title.toLowerCase().includes(lowerQuery)) {
				return true;
			}

			// Search in description
			if (show.description.toLowerCase().includes(lowerQuery)) {
				return true;
			}

			// Search in genres (array of strings)
			if (show.genres.some((genre) => genre.toLowerCase().includes(lowerQuery))) {
				return true;
			}

			return false;
		});
	}

	function sortShows(
		shows: ShowDto[],
		field: 'averageScore' | 'date',
		direction: 'asc' | 'desc'
	): ShowDto[] {
		const sorted = [...shows]; // Shallow copy to avoid mutation

		sorted.sort((a, b) => {
			let compareResult: number;

			if (field === 'averageScore') {
				// Handle null scores - push to end
				if (a.averageScore === null && b.averageScore === null) return 0;
				if (a.averageScore === null) return 1;
				if (b.averageScore === null) return -1;

				compareResult = a.averageScore - b.averageScore;
			} else {
				// field === 'date'
				// Extract date based on discriminated union type
				const dateA = a.type === 'MOVIE' ? a.releaseDate : a.startDate;
				const dateB = b.type === 'MOVIE' ? b.releaseDate : b.startDate;

				// Handle null dates - push to end
				if (dateA === null && dateB === null) return 0;
				if (dateA === null) return 1;
				if (dateB === null) return -1;

				// Parse ISO date strings and compare
				const timeA = new Date(dateA).getTime();
				const timeB = new Date(dateB).getTime();

				compareResult = timeA - timeB;
			}

			// Apply direction multiplier
			return direction === 'asc' ? compareResult : -compareResult;
		});

		return sorted;
	}

	// Chain filtering then sorting
	const filteredShows = $derived(filterShows(shows, searchQuery));
	const sortedShows = $derived(sortShows(filteredShows, sortField, sortDirection));

	onMount(async () => {
		await loadShows();
	});

	async function loadShows() {
		if (!authStore.token) {
			error = 'Not authenticated';
			isLoading = false;
			return;
		}

		isLoading = true;
		error = null;

		try {
			const response = await getShowsAPI(authStore.token);

			if ('shows' in response) {
				shows = response.shows;
			} else {
				error = response.message || 'Failed to load shows';
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
	<title>Home - MyShowList</title>
</svelte:head>

<div class="container">
	<div class="hero">
		<h1>Hello, {authStore.user?.username}!</h1>
		<p class="hero-text">Welcome to MyShowList - Your personal TV show tracker</p>
	</div>

	<section class="shows-section">
		<h2>All Shows {#if sortedShows.length > 0}<span class="show-count">({sortedShows.length}{searchQuery.trim() ? ' filtered' : ''})</span>{/if}</h2>

		<div class="controls-section">
			<div class="control-group search-group">
				<label for="search-input">Search:</label>
				<input
					type="search"
					id="search-input"
					bind:value={searchQuery}
					placeholder="Search shows..."
					disabled={isLoading}
					aria-label="Search shows"
				/>
			</div>

			<div class="control-group">
				<label for="sort-field">Sort by:</label>
				<select
					id="sort-field"
					bind:value={sortField}
					disabled={isLoading}
					aria-label="Sort shows by"
				>
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
				{sortDirection === 'asc' ? '⭡' : '⭣'}
			</button>
		</div>

		{#if isLoading}
			<div class="loading-container">
				<div class="loading-spinner"></div>
				<p>Loading shows...</p>
			</div>
		{:else if error}
			<div class="error-banner">
				{error}
			</div>
			<div style="text-align: center; margin-top: 1rem;">
				<button onclick={loadShows} class="btn-primary">Try Again</button>
			</div>
		{:else if sortedShows.length === 0}
			<div class="empty-state">
				{#if searchQuery.trim()}
					<p>No shows found matching "{searchQuery}"</p>
					<p class="hint">Try a different search term.</p>
				{:else}
					<p>No shows available yet.</p>
					<p class="hint">Check back later for new content!</p>
				{/if}
			</div>
		{:else}
			<div class="shows-grid">
				{#each sortedShows as show, index (show.id)}
					<a href="/shows/{show.id}" class="show-card-link">
						<article class="show-card">
							<div class="show-thumbnail">
								{#if !imageErrors.get(show.id) && show.thumbnailUrl}
									<img
										src={show.thumbnailUrl}
										alt="{show.title} poster"
										class="thumbnail-image"
										onerror={() => handleImageError(show.id)}
									/>
								{:else}
									<div
										class="thumbnail-placeholder"
										style="background: {getPlaceholderGradient(index)};"
									></div>
								{/if}
								<span class="show-type-badge">{show.type === 'MOVIE' ? 'Movie' : 'TV'}</span>
							</div>
							<div class="show-info">
								<h3>{show.title}</h3>
								<div class="show-score">
									<span class="score-icon">⭐</span>
									<span class="score-value">{formatScore(show.averageScore)}</span>
								</div>
								{#if show.genres.length > 0}
									<div class="show-genres">
										{show.genres.slice(0, 3).join(' • ')}
									</div>
								{/if}
							</div>
						</article>
					</a>
				{/each}
			</div>
		{/if}
	</section>

	<div class="features">
		<div class="feature-card">
			<div class="feature-icon">📺</div>
			<h3>Track Your Shows</h3>
			<p>Keep track of all your favorite TV shows and movies in one place.</p>
		</div>

		<div class="feature-card">
			<div class="feature-icon">⭐</div>
			<h3>Rate & Review</h3>
			<p>Share your thoughts and rate shows to remember what you loved.</p>
		</div>

		<div class="feature-card">
			<div class="feature-icon">📊</div>
			<h3>Track Progress</h3>
			<p>Monitor your watching progress and discover what to watch next.</p>
		</div>

		<div class="feature-card">
			<div class="feature-icon">🔍</div>
			<h3>Discover More</h3>
			<p>Find new shows based on your preferences and viewing history.</p>
		</div>
	</div>

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

	.features {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: var(--space-6);
		margin-bottom: var(--space-12);
	}

	.feature-card {
		background: var(--color-white);
		padding: var(--space-8);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
		transition: transform var(--transition-base), box-shadow var(--transition-base);
		text-align: center;
	}

	.feature-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-lg);
	}

	.feature-icon {
		font-size: 3rem;
		margin-bottom: var(--space-4);
	}

	.feature-card h3 {
		margin: 0 0 var(--space-3) 0;
		color: var(--color-dark-medium);
		font-size: var(--font-size-xl);
	}

	.feature-card p {
		margin: 0;
		color: var(--color-gray);
		line-height: 1.6;
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

	.search-group {
		flex: 1;
		min-width: 250px;
		max-width: 400px;
	}

	.search-group input {
		width: 100%;
		padding: var(--space-3) var(--space-4);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: var(--font-size-base);
		color: var(--color-dark);
		background: var(--color-white);
		transition: border-color var(--transition-base);
	}

	.search-group input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
	}

	.search-group input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		background: var(--color-bg-light);
	}

	.search-group input::placeholder {
		color: var(--color-gray-light);
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

	.empty-state p {
		margin: var(--space-2) 0;
		color: var(--color-gray);
	}

	.empty-state .hint {
		font-size: var(--font-size-sm);
		color: var(--color-gray-light);
	}

	.shows-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: var(--space-6);
	}

	.show-card-link {
		text-decoration: none;
		color: inherit;
		display: block;
	}

	.show-card {
		background: var(--color-white);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
		transition: transform var(--transition-base), box-shadow var(--transition-base);
		overflow: hidden;
		height: 100%;
	}

	.show-card-link:hover .show-card {
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

	.show-score {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
	}

	.score-icon {
		font-size: var(--font-size-lg);
	}

	.score-value {
		font-weight: 600;
		color: var(--color-primary);
		font-size: var(--font-size-base);
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

		.search-group {
			width: 100%;
			max-width: none;
			min-width: 0;
		}

		.sort-direction-btn {
			width: 100%;
			justify-content: center;
		}

		.shows-grid {
			grid-template-columns: 1fr;
		}

		.features {
			grid-template-columns: 1fr;
		}
	}
</style>
