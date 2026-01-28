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

	function handleImageError(showId: string) {
		const newErrors = new Map(imageErrors);
		newErrors.set(showId, true);
		imageErrors = newErrors;
	}

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

	<div class="hello-world">
		<h2>Hello World</h2>
		<p>This is your authenticated home page. You're successfully logged in!</p>
	</div>

	<section class="shows-section">
		<h2>All Shows</h2>

		{#if isLoading}
			<div class="loading-state">
				<div class="spinner"></div>
				<p>Loading shows...</p>
			</div>
		{:else if error}
			<div class="error-state">
				<p class="error-message">{error}</p>
				<button onclick={loadShows} class="retry-button">Try Again</button>
			</div>
		{:else if shows.length === 0}
			<div class="empty-state">
				<p>No shows available yet.</p>
				<p class="hint">Check back later for new content!</p>
			</div>
		{:else}
			<div class="shows-grid">
				{#each shows as show, index (show.id)}
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

	<div class="getting-started">
		<h2>Getting Started</h2>
		<p>Features are coming soon! This application is currently under development.</p>
		<p>Stay tuned for updates as we build out the full show tracking experience.</p>
	</div>
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

	.hello-world {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 2rem;
		border-radius: 1rem;
		margin-bottom: 3rem;
		text-align: center;
		box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
	}

	.hello-world h2 {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
	}

	.hello-world p {
		margin: 0;
		font-size: 1.1rem;
		opacity: 0.95;
	}

	.features {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		margin-bottom: 3rem;
	}

	.feature-card {
		background: white;
		padding: 2rem;
		border-radius: 0.75rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s, box-shadow 0.2s;
		text-align: center;
	}

	.feature-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
	}

	.feature-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.feature-card h3 {
		margin: 0 0 0.75rem 0;
		color: #2d3748;
		font-size: 1.25rem;
	}

	.feature-card p {
		margin: 0;
		color: #718096;
		line-height: 1.6;
	}

	.getting-started {
		background: #f7fafc;
		padding: 2rem;
		border-radius: 0.75rem;
		text-align: center;
		border: 2px dashed #cbd5e0;
	}

	.getting-started h2 {
		margin: 0 0 1rem 0;
		color: #2d3748;
	}

	.getting-started p {
		margin: 0.5rem 0;
		color: #718096;
		line-height: 1.6;
	}

	.shows-section {
		margin-bottom: 3rem;
	}

	.shows-section h2 {
		margin: 0 0 1.5rem 0;
		font-size: 1.75rem;
		color: #1a202c;
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

	.empty-state p {
		margin: 0.5rem 0;
		color: #718096;
	}

	.empty-state .hint {
		font-size: 0.9rem;
		color: #a0aec0;
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

	.show-card {
		background: white;
		border-radius: 0.75rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s, box-shadow 0.2s;
		overflow: hidden;
		height: 100%;
	}

	.show-card-link:hover .show-card {
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

	.show-score {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		margin-bottom: 0.5rem;
	}

	.score-icon {
		font-size: 1.125rem;
	}

	.score-value {
		font-weight: 600;
		color: #667eea;
		font-size: 1rem;
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

		.hello-world h2 {
			font-size: 1.5rem;
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

		.features {
			grid-template-columns: 1fr;
		}
	}
</style>
