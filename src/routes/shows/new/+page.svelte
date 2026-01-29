<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { createShowAPI, externalSearchAPI } from '$lib/api/client';
	import ShowForm from '$lib/components/ShowForm.svelte';
	import type { CreateShowFormErrors, CreateShowRequest } from '$lib/types/create-show';
	import {
		isCreateShowSuccess,
		isCreateShowGenresNotFound,
		isCreateShowFailure
	} from '$lib/types/create-show';
	import type { ShowFormData } from '$lib/components/ShowForm.svelte';
	import type { ShowDto } from '$lib/types/show';
	import type {
		ExternalSearchResponseOk,
		ExternalSearchResponseFailure,
		ExternalShowDto
	} from '$lib/types/external-search';
	import {
		isExternalSearchOk,
		isExternalSearchFailure,
		toShowDto
	} from '$lib/types/external-search';
	import { debounce } from '$lib/utils/debounce';

	let isLoading = $state(false);
	let errors = $state<CreateShowFormErrors>({});

	// Search state
	let searchQuery = $state('');
	let searchResults = $state<ExternalSearchResponseOk | null>(null);
	let searchLoading = $state(false);
	let searchError = $state<string | null>(null);
	let showResults = $state(false);
	let selectedShow = $state<ShowDto | null>(null);
	let focusedResultIndex = $state(-1);

	// Derived state
	const hasSearchResults = $derived(
		searchResults !== null &&
			(searchResults.tvSeries.length > 0 || searchResults.movies.length > 0)
	);
	const displayedTvSeries = $derived(searchResults?.tvSeries.slice(0, 5) || []);
	const displayedMovies = $derived(searchResults?.movies.slice(0, 5) || []);
	const totalResults = $derived(displayedTvSeries.length + displayedMovies.length);

	async function handleSubmit(formData: ShowFormData) {
		errors = {};

		if (!authStore.token) {
			errors = { general: 'Not authenticated' };
			return;
		}

		isLoading = true;

		try {
			// Build polymorphic request based on showType
			const request: CreateShowRequest =
				formData.showType === 'MOVIE'
					? {
							type: 'MOVIE',
							title: formData.title.trim(),
							description: formData.description.trim(),
							thumbnailUrl: formData.thumbnailUrl.trim(),
							genres: Array.from(formData.selectedGenres),
							releaseDate: formData.releaseDate
						}
					: {
							type: 'TV_SERIES',
							title: formData.title.trim(),
							description: formData.description.trim(),
							thumbnailUrl: formData.thumbnailUrl.trim(),
							genres: Array.from(formData.selectedGenres),
							episodeCount: Number(formData.episodeCount),
							startDate: formData.startDate,
							endDate: formData.endDate.trim() === '' ? null : formData.endDate
						};

			const response = await createShowAPI(request, authStore.token);

			// Pattern match response (DOP)
			if (isCreateShowSuccess(response)) {
				goto(`/shows/${response.showId}`);
				return;
			}

			if (isCreateShowGenresNotFound(response)) {
				// TypeScript narrowing - explicit assertion after guard
				const genresResponse = response as import('$lib/types/create-show').CreateShowResponseGenresNotFound;
				errors = {
					genres: `The following genres do not exist: ${genresResponse.missingGenres.join(', ')}`
				};
				return;
			}

			if (isCreateShowFailure(response)) {
				// TypeScript narrowing - explicit assertion after guard
				const failureResponse = response as import('$lib/types/create-show').CreateShowResponseFailure;
				errors = { general: failureResponse.message };
				return;
			}

			errors = { general: 'An unexpected error occurred' };
		} catch (error) {
			errors = {
				general: error instanceof Error ? error.message : 'An unexpected error occurred'
			};
		} finally {
			isLoading = false;
		}
	}

	function handleCancel() {
		goto('/');
	}

	// Search logic
	const debouncedSearch = debounce(async (query: string) => {
		if (!authStore.token) {
			searchError = 'Authentication required';
			return;
		}

		if (query.trim().length === 0) {
			searchResults = null;
			searchError = null;
			showResults = false;
			return;
		}

		searchLoading = true;
		searchError = null;

		try {
			const response = await externalSearchAPI(query.trim(), authStore.token);

			if (isExternalSearchOk(response)) {
				searchResults = response;
				showResults = true;
				searchError = null;
			} else if (isExternalSearchFailure(response)) {
				const failureResponse = response as ExternalSearchResponseFailure;
				searchError = failureResponse.message;
				searchResults = null;
				showResults = false;
			}
		} catch (error) {
			searchError = error instanceof Error ? error.message : 'Search failed';
			searchResults = null;
			showResults = false;
		} finally {
			searchLoading = false;
		}
	}, 400);

	function handleSearchInput(event: Event) {
		const target = event.target as HTMLInputElement;
		searchQuery = target.value;
		debouncedSearch(searchQuery);
	}

	function handleSelectShow(externalShow: ExternalShowDto) {
		selectedShow = toShowDto(externalShow);
		searchQuery = '';
		searchResults = null;
		showResults = false;
		searchError = null;
		focusedResultIndex = -1;
	}

	function handleClearSearch() {
		searchQuery = '';
		searchResults = null;
		showResults = false;
		searchError = null;
		selectedShow = null;
		focusedResultIndex = -1;
	}

	function handleSearchKeydown(event: KeyboardEvent) {
		if (!showResults || !hasSearchResults) return;

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				focusedResultIndex = (focusedResultIndex + 1) % totalResults;
				break;
			case 'ArrowUp':
				event.preventDefault();
				focusedResultIndex = focusedResultIndex <= 0 ? totalResults - 1 : focusedResultIndex - 1;
				break;
			case 'Enter':
				event.preventDefault();
				if (focusedResultIndex >= 0) {
					const allResults = [...displayedTvSeries, ...displayedMovies];
					handleSelectShow(allResults[focusedResultIndex]);
				}
				break;
			case 'Escape':
				event.preventDefault();
				showResults = false;
				focusedResultIndex = -1;
				break;
		}
	}
</script>

<svelte:head>
	<title>Add Show - MyShowList</title>
</svelte:head>

<div class="container">
	<nav class="breadcrumb">
		<a href="/">Home</a>
		<span class="separator">/</span>
		<span class="current">Add Show</span>
	</nav>

	<!-- Search Section -->
	<div class="search-section">
		<h2>Search External Database (Optional)</h2>
		<p class="search-hint">
			Search for a show to automatically populate the form below, or skip this step to create a
			show manually.
		</p>

		<div class="search-container">
			<div class="search-input-wrapper">
				<input
					type="text"
					bind:value={searchQuery}
					oninput={handleSearchInput}
					onkeydown={handleSearchKeydown}
					placeholder="Search for movies or TV series..."
					class="search-input"
					aria-label="Search for shows"
					aria-describedby="search-help"
					aria-autocomplete="list"
					aria-controls="search-results"
					disabled={searchLoading}
				/>

				{#if searchLoading}
					<span class="search-spinner" aria-label="Searching..."></span>
				{/if}

				{#if searchQuery.length > 0}
					<button
						type="button"
						class="clear-search-btn"
						onclick={handleClearSearch}
						aria-label="Clear search"
					>
						✕
					</button>
				{/if}
			</div>

			<span id="search-help" class="search-help">
				Start typing to search. Results limited to 5 TV series and 5 movies.
			</span>

			<!-- Search Error -->
			{#if searchError}
				<div class="search-error" role="alert">
					{searchError}
				</div>
			{/if}

			<!-- Search Results Dropdown -->
			{#if showResults}
				<div id="search-results" class="search-results" role="listbox" aria-label="Search results">
					{#if !hasSearchResults}
						<div class="no-results">No results found for "{searchQuery}"</div>
					{:else}
						<!-- TV Series Section -->
						{#if displayedTvSeries.length > 0}
							<div class="results-section">
								<h3 class="results-heading">TV Series</h3>
								{#each displayedTvSeries as show, index (show.id)}
									<button
										type="button"
										class="result-item"
										class:focused={focusedResultIndex === index}
										onclick={() => handleSelectShow(show)}
										role="option"
										aria-selected={focusedResultIndex === index}
									>
										<div class="result-thumbnail">
											<img src={show.thumbnailUrl} alt="{show.title} poster" />
										</div>
										<div class="result-info">
											<div class="result-title">{show.title}</div>
											<div class="result-meta">
												<span class="result-type-badge tv">TV Series</span>
												<span class="result-episodes">{show.episodeCount} episodes</span>
											</div>
										</div>
									</button>
								{/each}
							</div>
						{/if}

						<!-- Movies Section -->
						{#if displayedMovies.length > 0}
							<div class="results-section">
								<h3 class="results-heading">Movies</h3>
								{#each displayedMovies as show, index (show.id)}
									<button
										type="button"
										class="result-item"
										class:focused={focusedResultIndex === displayedTvSeries.length + index}
										onclick={() => handleSelectShow(show)}
										role="option"
										aria-selected={focusedResultIndex === displayedTvSeries.length + index}
									>
										<div class="result-thumbnail">
											<img src={show.thumbnailUrl} alt="{show.title} poster" />
										</div>
										<div class="result-info">
											<div class="result-title">{show.title}</div>
											<div class="result-meta">
												<span class="result-type-badge movie">Movie</span>
												<span class="result-date">
													{new Date(show.releaseDate).getFullYear()}
												</span>
											</div>
										</div>
									</button>
								{/each}
							</div>
						{/if}
					{/if}
				</div>
			{/if}
		</div>

		<!-- Selected Show Indicator -->
		{#if selectedShow}
			<div class="selected-show-banner">
				✓ Form pre-filled with: <strong>{selectedShow.title}</strong>
				<button type="button" class="clear-selection-btn" onclick={handleClearSearch}>
					Clear and start over
				</button>
			</div>
		{/if}
	</div>

	<!-- Divider -->
	<div class="form-divider">
		<span>OR</span>
	</div>

	{#key selectedShow?.id || 'new'}
		<ShowForm
			mode="create"
			initialData={selectedShow}
			{isLoading}
			{errors}
			onSubmit={handleSubmit}
			onCancel={handleCancel}
		/>
	{/key}
</div>

<style>
	.container {
		max-width: 800px;
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

	/* Search Section */
	.search-section {
		background: white;
		padding: 2rem;
		border-radius: 1rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.search-section h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
		color: #1a202c;
	}

	.search-hint {
		margin: 0 0 1.5rem 0;
		color: #718096;
		font-size: 0.9rem;
	}

	.search-container {
		position: relative;
	}

	.search-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-input {
		width: 100%;
		padding: 0.875rem 3rem 0.875rem 1rem;
		border: 2px solid #cbd5e0;
		border-radius: 0.5rem;
		font-size: 1rem;
		transition: all 0.2s;
	}

	.search-input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.search-input:disabled {
		background: #f7fafc;
		cursor: not-allowed;
	}

	.search-spinner {
		position: absolute;
		right: 3rem;
		width: 20px;
		height: 20px;
		border: 2px solid #e2e8f0;
		border-top-color: #667eea;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.clear-search-btn {
		position: absolute;
		right: 0.75rem;
		background: none;
		border: none;
		color: #a0aec0;
		font-size: 1.25rem;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		transition: color 0.2s;
	}

	.clear-search-btn:hover {
		color: #718096;
	}

	.search-help {
		display: block;
		margin-top: 0.5rem;
		font-size: 0.85rem;
		color: #718096;
	}

	.search-error {
		margin-top: 0.75rem;
		padding: 0.75rem;
		background: #fed7d7;
		color: #c53030;
		border-radius: 0.5rem;
		font-size: 0.9rem;
		border: 1px solid #fc8181;
	}

	/* Results Dropdown */
	.search-results {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		margin-top: 0.5rem;
		background: white;
		border: 1px solid #cbd5e0;
		border-radius: 0.75rem;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
		max-height: 500px;
		overflow-y: auto;
		z-index: 50;
	}

	.no-results {
		padding: 2rem;
		text-align: center;
		color: #718096;
		font-size: 0.95rem;
	}

	.results-section {
		border-bottom: 1px solid #e2e8f0;
	}

	.results-section:last-child {
		border-bottom: none;
	}

	.results-heading {
		padding: 1rem 1.25rem 0.5rem;
		margin: 0;
		font-size: 0.85rem;
		font-weight: 600;
		color: #718096;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.result-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		width: 100%;
		padding: 0.875rem 1.25rem;
		border: none;
		background: white;
		cursor: pointer;
		text-align: left;
		transition: background 0.2s;
	}

	.result-item:hover,
	.result-item.focused {
		background: #f7fafc;
	}

	.result-thumbnail {
		width: 50px;
		height: 75px;
		border-radius: 0.375rem;
		overflow: hidden;
		flex-shrink: 0;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.result-thumbnail img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.result-info {
		flex: 1;
		min-width: 0;
	}

	.result-title {
		font-weight: 600;
		color: #2d3748;
		font-size: 0.95rem;
		margin-bottom: 0.25rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.result-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.85rem;
		color: #718096;
	}

	.result-type-badge {
		display: inline-block;
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
		font-weight: 600;
		font-size: 0.75rem;
	}

	.result-type-badge.tv {
		background: #e6fffa;
		color: #047857;
	}

	.result-type-badge.movie {
		background: #fef3c7;
		color: #92400e;
	}

	/* Selected Show Banner */
	.selected-show-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 1rem;
		padding: 0.875rem 1rem;
		background: #d1fae5;
		border: 1px solid #6ee7b7;
		border-radius: 0.5rem;
		color: #047857;
		font-size: 0.9rem;
	}

	.clear-selection-btn {
		background: white;
		color: #047857;
		border: 1px solid #6ee7b7;
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.clear-selection-btn:hover {
		background: #f0fdf4;
	}

	/* Form Divider */
	.form-divider {
		display: flex;
		align-items: center;
		margin: 2rem 0;
		color: #a0aec0;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-size: 0.85rem;
	}

	.form-divider::before,
	.form-divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: #e2e8f0;
	}

	.form-divider span {
		padding: 0 1rem;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.search-section {
			padding: 1.5rem;
		}

		.search-section h2 {
			font-size: 1.25rem;
		}

		.result-thumbnail {
			width: 40px;
			height: 60px;
		}

		.selected-show-banner {
			flex-direction: column;
			gap: 0.75rem;
			align-items: flex-start;
		}

		.clear-selection-btn {
			width: 100%;
		}
	}
</style>
