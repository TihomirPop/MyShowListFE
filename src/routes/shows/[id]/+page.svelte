<script lang="ts">
	import type { PageData } from './$types';
	import { formatScore, getPlaceholderGradient } from '$lib/utils/show';
	import Reviews from '$lib/components/Reviews.svelte';
	import UserShow from '$lib/components/UserShow.svelte';
	import { getShowByIdAPI, deleteShowAPI } from '$lib/api/client';
	import { authStore } from '$lib/stores/auth.svelte';
	import { isSingleShowOk } from '$lib/types/show';
	import {
		isDeleteShowOk,
		isDeleteShowFailure,
		type DeleteShowResponseFailure
	} from '$lib/types/delete-show';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let show = $state(data.show);

	// Admin functionality state
	let isDeleting = $state(false);
	let deleteError = $state<string | null>(null);
	const isAdmin = $derived(authStore.user?.role === 'ADMIN');

	// Function to refresh show data from API
	async function refreshShow() {
		if (!authStore.token) return;

		const response = await getShowByIdAPI(show.id, authStore.token);

		if (isSingleShowOk(response)) {
			show = response.show;
		}
	}

	function handleEdit() {
		goto(`/shows/${show.id}/edit`);
	}

	async function handleDelete() {
		// Browser confirmation dialog
		if (!confirm('Are you sure you want to delete this show? This action cannot be undone.')) {
			return;
		}

		if (!authStore.token) {
			deleteError = 'Authentication required';
			return;
		}

		isDeleting = true;
		deleteError = null;

		const response = await deleteShowAPI(show.id, authStore.token);

		if (isDeleteShowOk(response)) {
			// Success - navigate to home page
			goto('/');
		} else if (isDeleteShowFailure(response)) {
			// Failure - show error message
			// TypeScript doesn't properly narrow after multiple guards, use explicit assertion
			const failureResponse = response as DeleteShowResponseFailure;
			deleteError = failureResponse.message;
			isDeleting = false;
		} else {
			// NotFound case
			deleteError = 'Show not found';
			isDeleting = false;
		}
	}

	// Format dates based on show type
	const formattedDate = $derived.by(() => {
		if (show.type === 'MOVIE') {
			return new Date(show.releaseDate).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
		}
		// TV series date range
		const start = show.startDate ? new Date(show.startDate).getFullYear() : 'Unknown';
		const end = show.endDate ? new Date(show.endDate).getFullYear() : 'Ongoing';
		return `${start} - ${end}`;
	});
</script>

<svelte:head>
	<title>{show.title} - MyShowList</title>
</svelte:head>

<div class="container">
	<!-- Breadcrumb navigation -->
	<nav class="breadcrumb">
		<a href="/">Home</a>
		<span class="separator">/</span>
		<span class="current">{show.title}</span>
	</nav>

	<!-- Show header with thumbnail and main info -->
	<div class="show-header">
		<div class="show-thumbnail" style="background: {getPlaceholderGradient(0)};">
			<span class="show-type-badge">
				{show.type === 'MOVIE' ? 'Movie' : 'TV Series'}
			</span>
		</div>

		<div class="show-main-info">
			<h1 class="show-title">{show.title}</h1>

			{#if isAdmin}
				<div class="admin-actions">
					<button class="edit-button" onclick={handleEdit} disabled={isDeleting}>
						Edit Show
					</button>
					<button class="delete-button" onclick={handleDelete} disabled={isDeleting}>
						{isDeleting ? 'Deleting...' : 'Delete Show'}
					</button>
				</div>

				{#if deleteError}
					<div class="delete-error">
						{deleteError}
					</div>
				{/if}
			{/if}

			<div class="show-meta">
				<div class="meta-item">
					<span class="meta-label">Rating:</span>
					<div class="show-score">
						<span class="score-icon">⭐</span>
						<span class="score-value">{formatScore(show.averageScore)}</span>
					</div>
				</div>

				<div class="meta-item">
					<span class="meta-label">
						{show.type === 'MOVIE' ? 'Release Date:' : 'Years:'}
					</span>
					<span class="meta-value">{formattedDate}</span>
				</div>

				{#if show.type === 'TV_SERIES' && show.episodeCount}
					<div class="meta-item">
						<span class="meta-label">Episodes:</span>
						<span class="meta-value">{show.episodeCount}</span>
					</div>
				{/if}
			</div>

			{#if show.genres.length > 0}
				<div class="show-genres">
					{#each show.genres as genre (genre)}
						<span class="genre-tag">{genre}</span>
					{/each}
				</div>
			{/if}

			<!-- User show tracking -->
			<UserShow showId={show.id} initialUserShow={data.userShow} show={show} onScoreUpdated={refreshShow} />
		</div>
	</div>

	<!-- Description section -->
	<div class="show-description-section">
		<h2>Description</h2>
		<p class="show-description">{show.description}</p>
	</div>

	<!-- Reviews section -->
	<Reviews showId={show.id} />
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1.5rem;
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 2rem;
		font-size: 0.9rem;
		color: #718096;
	}

	.breadcrumb a {
		color: #667eea;
		text-decoration: none;
		transition: opacity 0.2s;
	}

	.breadcrumb a:hover {
		opacity: 0.8;
	}

	.separator {
		color: #cbd5e0;
	}

	.current {
		color: #2d3748;
		font-weight: 500;
	}

	.show-header {
		display: grid;
		grid-template-columns: 300px 1fr;
		gap: 2rem;
		margin-bottom: 3rem;
	}

	.show-thumbnail {
		width: 100%;
		height: 450px;
		border-radius: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
	}

	.show-type-badge {
		background: rgba(255, 255, 255, 0.9);
		color: #2d3748;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.show-title {
		margin: 0 0 1.5rem 0;
		font-size: 2.5rem;
		color: #1a202c;
		line-height: 1.2;
	}

	.show-meta {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.meta-label {
		font-weight: 600;
		color: #4a5568;
		min-width: 120px;
	}

	.meta-value {
		color: #2d3748;
	}

	.show-score {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.score-icon {
		font-size: 1.25rem;
	}

	.score-value {
		font-weight: 700;
		color: #667eea;
		font-size: 1.125rem;
	}

	.show-genres {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.genre-tag {
		background: #f7fafc;
		color: #4a5568;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		border: 1px solid #e2e8f0;
	}

	.show-description-section {
		background: white;
		padding: 2rem;
		border-radius: 0.75rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.show-description-section h2 {
		margin: 0 0 1rem 0;
		color: #2d3748;
		font-size: 1.5rem;
	}

	.show-description {
		color: #4a5568;
		line-height: 1.7;
		margin: 0;
	}

	.admin-actions {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.edit-button,
	.delete-button {
		padding: 0.625rem 1.25rem;
		border: none;
		border-radius: 0.5rem;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.edit-button {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
	}

	.edit-button:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.delete-button {
		background: #fff5f5;
		color: #c53030;
		border: 1px solid #fc8181;
	}

	.delete-button:hover:not(:disabled) {
		background: #fed7d7;
		border-color: #f56565;
	}

	.edit-button:disabled,
	.delete-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.delete-error {
		margin-bottom: 1rem;
		padding: 0.75rem;
		background: #fff5f5;
		border: 1px solid #fc8181;
		border-radius: 0.375rem;
		color: #c53030;
		font-size: 0.9rem;
	}

	@media (max-width: 768px) {
		.show-header {
			grid-template-columns: 1fr;
		}

		.show-thumbnail {
			height: 300px;
		}

		.show-title {
			font-size: 2rem;
		}

		.admin-actions {
			flex-direction: column;
		}

		.edit-button,
		.delete-button {
			width: 100%;
		}
	}
</style>
