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

	const showCount = $derived(userShows.length);

	function handleImageError(showId: string) {
		const newErrors = new Map(imageErrors);
		newErrors.set(showId, true);
		imageErrors = newErrors;
	}

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

		{#if isLoading}
			<div class="loading-state">
				<div class="spinner"></div>
				<p>Loading your shows...</p>
			</div>
		{:else if error}
			<div class="error-state">
				<p class="error-message">{error}</p>
				<button onclick={loadUserShows} class="retry-button">Try Again</button>
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
				{#each userShows as userShow, index (userShow.show.id)}
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
		padding: 2rem 1.5rem;
	}

	.hero {
		text-align: center;
		margin-bottom: 3rem;
		padding: 2rem 0;
	}

	h1 {
		margin: 0 0 1rem 0;
		font-size: 2.5rem;
		color: #1a202c;
		font-weight: 700;
	}

	.hero-text {
		font-size: 1.25rem;
		color: #718096;
		margin: 0;
	}

	.shows-section {
		margin-bottom: 3rem;
	}

	.shows-section h2 {
		margin: 0 0 1.5rem 0;
		font-size: 1.75rem;
		color: #1a202c;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.show-count {
		font-size: 1.25rem;
		color: #718096;
		font-weight: 400;
	}

	.loading-state {
		text-align: center;
		padding: 3rem;
		color: #718096;
	}

	.spinner {
		width: 40px;
		height: 40px;
		margin: 0 auto 1rem;
		border: 3px solid #e2e8f0;
		border-top-color: #667eea;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error-state {
		text-align: center;
		padding: 2rem;
		background: #fff5f5;
		border-radius: 0.75rem;
		border: 1px solid #fc8181;
	}

	.error-message {
		color: #c53030;
		margin: 0 0 1rem 0;
	}

	.retry-button {
		background: #667eea;
		color: white;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		font-size: 0.95rem;
		transition: background 0.2s;
	}

	.retry-button:hover {
		background: #5568d3;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		background: #f7fafc;
		border-radius: 0.75rem;
		border: 2px dashed #cbd5e0;
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.empty-state p {
		margin: 0.5rem 0;
		color: #718096;
		font-size: 1.1rem;
	}

	.empty-state .hint {
		font-size: 0.95rem;
		color: #a0aec0;
		margin-bottom: 1.5rem;
	}

	.browse-button {
		display: inline-block;
		background: #667eea;
		color: white;
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		text-decoration: none;
		font-weight: 600;
		transition: background 0.2s;
	}

	.browse-button:hover {
		background: #5568d3;
	}

	.shows-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.show-card-link {
		text-decoration: none;
		color: inherit;
		display: block;
	}

	.user-show-card {
		background: white;
		border-radius: 0.75rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s, box-shadow 0.2s;
		overflow: hidden;
		height: 100%;
	}

	.show-card-link:hover .user-show-card {
		transform: translateY(-4px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
	}

	.show-thumbnail {
		width: 100%;
		height: 200px;
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
		top: 0.75rem;
		left: 0.75rem;
		background: rgba(255, 255, 255, 0.9);
		color: #2d3748;
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.025em;
		z-index: 1;
	}

	.status-badge {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: capitalize;
		letter-spacing: 0.025em;
		z-index: 1;
	}

	.show-info {
		padding: 1.25rem;
	}

	.show-info h3 {
		margin: 0 0 0.75rem 0;
		font-size: 1.125rem;
		color: #2d3748;
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.scores-row {
		display: flex;
		gap: 1rem;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.show-score {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.score-icon {
		font-size: 1.125rem;
	}

	.score-value {
		font-weight: 600;
		color: #667eea;
		font-size: 1rem;
	}

	.user-score {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.user-score .score-icon {
		font-size: 1rem;
	}

	.user-score .score-value {
		font-weight: 600;
		color: #4a5568;
		font-size: 0.9rem;
	}

	.progress-indicator {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.85rem;
		color: #718096;
		margin-top: 0.5rem;
		font-weight: 500;
	}

	.show-genres {
		font-size: 0.85rem;
		color: #718096;
		margin-top: 0.5rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	@media (max-width: 768px) {
		.container {
			padding: 1.5rem 1rem;
		}

		h1 {
			font-size: 2rem;
		}

		.hero-text {
			font-size: 1.1rem;
		}

		.shows-section h2 {
			font-size: 1.5rem;
		}

		.shows-grid {
			grid-template-columns: 1fr;
		}

		.show-thumbnail {
			height: 180px;
		}
	}
</style>
