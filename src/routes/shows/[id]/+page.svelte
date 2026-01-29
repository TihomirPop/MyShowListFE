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

	// Image loading state
	let imageLoadError = $state(false);

	function handleImageError() {
		imageLoadError = true;
	}

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
		const start = show.startDate
			? new Date(show.startDate).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			})
			: 'Unknown';
		const end = show.endDate
			? new Date(show.endDate).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			})
			: 'Ongoing';
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
		<div class="show-thumbnail-container">
			{#if !imageLoadError && show.thumbnailUrl}
				<img
					src={show.thumbnailUrl}
					alt="{show.title} poster"
					class="show-thumbnail-image"
					onerror={handleImageError}
				/>
			{:else}
				<div
					class="show-thumbnail-placeholder"
					style="background: {getPlaceholderGradient(0)};"
				></div>
			{/if}
			<span class="show-type-badge">
				{show.type === 'MOVIE' ? 'Movie' : 'TV Series'}
			</span>
		</div>

		<div class="show-main-info">
			<h1 class="show-title">{show.title}</h1>

			{#if isAdmin}
				<div class="admin-actions">
					<button class="btn-primary" onclick={handleEdit} disabled={isDeleting}>
						Edit Show
					</button>
					<button class="btn-danger" onclick={handleDelete} disabled={isDeleting}>
						{isDeleting ? 'Deleting...' : 'Delete Show'}
					</button>
				</div>

				{#if deleteError}
					<div class="error-banner">
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
		padding: var(--space-8) var(--space-6);
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-8);
		font-size: var(--font-size-sm);
		color: var(--color-gray);
	}

	.breadcrumb a {
		color: var(--color-primary);
		text-decoration: none;
		transition: opacity var(--transition-base);
	}

	.breadcrumb a:hover {
		opacity: 0.8;
	}

	.separator {
		color: var(--color-border);
	}

	.current {
		color: var(--color-dark-medium);
		font-weight: 500;
	}

	.show-header {
		display: grid;
		grid-template-columns: 300px 1fr;
		gap: var(--space-8);
		margin-bottom: var(--space-12);
	}

	.show-thumbnail-container {
		width: 300px;
		height: 450px;
		position: relative;
		border-radius: var(--radius-lg);
		overflow: hidden;
		box-shadow: var(--shadow-lg);
	}

	.show-thumbnail-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.show-thumbnail-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.show-type-badge {
		position: absolute;
		top: var(--space-4);
		left: var(--space-4);
		background: rgba(255, 255, 255, 0.9);
		color: var(--color-dark-medium);
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		z-index: 1;
	}

	.show-title {
		margin: 0 0 var(--space-6) 0;
		font-size: var(--font-size-3xl);
		color: var(--color-dark);
		line-height: 1.2;
	}

	.show-meta {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		margin-bottom: var(--space-6);
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.meta-label {
		font-weight: 600;
		color: var(--color-dark-light);
		min-width: 120px;
	}

	.meta-value {
		color: var(--color-dark-medium);
	}

	.show-score {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.score-icon {
		font-size: var(--font-size-xl);
	}

	.score-value {
		font-weight: 700;
		color: var(--color-primary);
		font-size: var(--font-size-lg);
	}

	.show-genres {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.genre-tag {
		background: var(--color-bg-light);
		color: var(--color-dark-light);
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-sm);
		font-weight: 500;
		border: 1px solid var(--color-border-light);
	}

	.show-description-section {
		background: var(--color-white);
		padding: var(--space-8);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
		margin-bottom: var(--space-8);
	}

	.show-description-section h2 {
		margin: 0 0 var(--space-4) 0;
		color: var(--color-dark-medium);
		font-size: var(--font-size-2xl);
	}

	.show-description {
		color: var(--color-dark-light);
		line-height: 1.7;
		margin: 0;
	}

	.admin-actions {
		display: flex;
		gap: var(--space-3);
		margin-bottom: var(--space-6);
		padding-bottom: var(--space-4);
		border-bottom: 1px solid var(--color-border-light);
	}

	@media (max-width: 768px) {
		.show-header {
			grid-template-columns: 1fr;
		}

		.show-thumbnail-container {
			width: 100%;
			height: 300px;
		}

		.show-title {
			font-size: var(--font-size-2xl);
		}

		.admin-actions {
			flex-direction: column;
		}

		.btn-primary,
		.btn-danger {
			width: 100%;
		}
	}
</style>
