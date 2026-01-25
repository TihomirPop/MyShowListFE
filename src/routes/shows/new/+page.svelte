<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { createShowAPI } from '$lib/api/client';
	import type {
		ShowType,
		CreateShowRequest,
		CreateShowFormErrors
	} from '$lib/types/create-show';
	import {
		isCreateShowSuccess,
		isCreateShowGenresNotFound,
		isCreateShowFailure
	} from '$lib/types/create-show';

	// Available genres (provided by user)
	const AVAILABLE_GENRES = [
		'Action',
		'Adventure',
		'Avant Garde',
		'Award Winning',
		'Comedy',
		'Drama',
		'Fantasy',
		'Gourmet',
		'Horror',
		'Mystery',
		'Romance',
		'Sci-Fi',
		'Slice of Life',
		'Sports',
		'Supernatural',
		'Suspense'
	];

	// Form state
	let showType = $state<ShowType>('MOVIE');
	let title = $state('');
	let description = $state('');
	let selectedGenres = $state<Set<string>>(new Set());

	// Movie-specific fields
	let releaseDate = $state('');

	// TV Series-specific fields
	let episodeCount = $state<number | ''>('');
	let startDate = $state('');
	let endDate = $state('');

	// UI state
	let isLoading = $state(false);
	let errors = $state<CreateShowFormErrors>({});

	// Derived state (computed validation)
	const canSubmit = $derived(
		title.trim().length > 0 &&
			description.trim().length > 0 &&
			selectedGenres.size > 0 &&
			(showType === 'MOVIE'
				? releaseDate.length > 0
				: episodeCount !== '' && startDate.length > 0 && endDate.length > 0)
	);

	function validateForm(): boolean {
		const newErrors: CreateShowFormErrors = {};

		// Title validation
		if (!title.trim()) {
			newErrors.title = 'Title is required';
		} else if (title.length > 255) {
			newErrors.title = 'Title must not exceed 255 characters';
		}

		// Description validation
		if (!description.trim()) {
			newErrors.description = 'Description is required';
		} else if (description.length > 65535) {
			newErrors.description = 'Description must not exceed 65535 characters';
		}

		// Genre validation
		if (selectedGenres.size === 0) {
			newErrors.genres = 'At least one genre is required';
		}

		// Type-specific validation
		if (showType === 'MOVIE') {
			if (!releaseDate) {
				newErrors.releaseDate = 'Release date is required';
			}
		} else {
			// TV_SERIES
			if (episodeCount === '' || episodeCount < 1) {
				newErrors.episodeCount = 'Episode count must be at least 1';
			}

			if (!startDate) {
				newErrors.startDate = 'Start date is required';
			}

			if (!endDate) {
				newErrors.endDate = 'End date is required';
			}

			// Date range validation
			if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
				newErrors.endDate = 'End date must not be before start date';
			}
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		errors = {}; // Clear previous errors

		// Client-side validation
		if (!validateForm()) {
			return;
		}

		if (!authStore.token) {
			errors = { general: 'Not authenticated' };
			return;
		}

		isLoading = true;

		try {
			// Build polymorphic request based on type
			const request: CreateShowRequest =
				showType === 'MOVIE'
					? {
							type: 'MOVIE',
							title: title.trim(),
							description: description.trim(),
							genres: Array.from(selectedGenres),
							releaseDate
						}
					: {
							type: 'TV_SERIES',
							title: title.trim(),
							description: description.trim(),
							genres: Array.from(selectedGenres),
							episodeCount: Number(episodeCount),
							startDate,
							endDate
						};

			// Call API
			const response = await createShowAPI(request, authStore.token);

			// Pattern match response (DOP)
			if (isCreateShowSuccess(response)) {
				// Success: redirect to new show's detail page
				goto(`/shows/${response.showId}`);
				return;
			}

			if (isCreateShowGenresNotFound(response)) {
				// Genres not found: display error with missing genres
				errors = {
					genres: `The following genres do not exist: ${response.missingGenres.join(', ')}`
				};
				return;
			}

			if (isCreateShowFailure(response)) {
				// Generic failure: display error message
				errors = { general: response.message };
				return;
			}

			// Exhaustiveness check (should never reach here)
			errors = { general: 'An unexpected error occurred' };
		} catch (error) {
			// Network or unexpected error
			errors = {
				general: error instanceof Error ? error.message : 'An unexpected error occurred'
			};
		} finally {
			isLoading = false;
		}
	}

	function toggleGenre(genre: string) {
		const newSet = new Set(selectedGenres);
		if (newSet.has(genre)) {
			newSet.delete(genre);
		} else {
			newSet.add(genre);
		}
		selectedGenres = newSet;
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

	<div class="form-card">
		<h1>Add New Show</h1>
		<p class="subtitle">Create a new movie or TV series</p>

		<form onsubmit={handleSubmit}>
			<!-- General error banner -->
			{#if errors.general}
				<div class="error-banner" role="alert">
					{errors.general}
				</div>
			{/if}

			<!-- Show Type Selection -->
			<div class="form-group">
				<label for="show-type">Show Type *</label>
				<select id="show-type" bind:value={showType} disabled={isLoading} class="select-input">
					<option value="MOVIE">Movie</option>
					<option value="TV_SERIES">TV Series</option>
				</select>
			</div>

			<!-- Title -->
			<div class="form-group">
				<label for="title">Title *</label>
				<input
					id="title"
					type="text"
					bind:value={title}
					placeholder="Enter show title"
					disabled={isLoading}
					aria-invalid={!!errors.title}
					aria-describedby={errors.title ? 'title-error' : undefined}
					maxlength="255"
				/>
				{#if errors.title}
					<span id="title-error" class="error-message" role="alert">
						{errors.title}
					</span>
				{/if}
			</div>

			<!-- Description -->
			<div class="form-group">
				<label for="description">Description *</label>
				<textarea
					id="description"
					bind:value={description}
					placeholder="Enter show description"
					disabled={isLoading}
					aria-invalid={!!errors.description}
					aria-describedby={errors.description ? 'description-error' : undefined}
					rows="5"
					maxlength="65535"
				></textarea>
				{#if errors.description}
					<span id="description-error" class="error-message" role="alert">
						{errors.description}
					</span>
				{/if}
			</div>

			<!-- Genres (Checkbox Group) -->
			<div class="form-group">
				<label id="genres-label">Genres * (select at least one)</label>
				<div class="genres-grid" role="group" aria-labelledby="genres-label">
					{#each AVAILABLE_GENRES as genre (genre)}
						<label class="genre-checkbox">
							<input
								type="checkbox"
								checked={selectedGenres.has(genre)}
								onchange={() => toggleGenre(genre)}
								disabled={isLoading}
							/>
							<span class="genre-label">{genre}</span>
						</label>
					{/each}
				</div>
				{#if errors.genres}
					<span class="error-message" role="alert">
						{errors.genres}
					</span>
				{/if}
			</div>

			<!-- Movie-specific fields -->
			{#if showType === 'MOVIE'}
				<div class="form-group">
					<label for="release-date">Release Date *</label>
					<input
						id="release-date"
						type="date"
						bind:value={releaseDate}
						disabled={isLoading}
						aria-invalid={!!errors.releaseDate}
						aria-describedby={errors.releaseDate ? 'release-date-error' : undefined}
					/>
					{#if errors.releaseDate}
						<span id="release-date-error" class="error-message" role="alert">
							{errors.releaseDate}
						</span>
					{/if}
				</div>
			{/if}

			<!-- TV Series-specific fields -->
			{#if showType === 'TV_SERIES'}
				<div class="form-group">
					<label for="episode-count">Episode Count *</label>
					<input
						id="episode-count"
						type="number"
						bind:value={episodeCount}
						placeholder="Enter episode count"
						min="1"
						disabled={isLoading}
						aria-invalid={!!errors.episodeCount}
						aria-describedby={errors.episodeCount ? 'episode-count-error' : undefined}
					/>
					{#if errors.episodeCount}
						<span id="episode-count-error" class="error-message" role="alert">
							{errors.episodeCount}
						</span>
					{/if}
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="start-date">Start Date *</label>
						<input
							id="start-date"
							type="date"
							bind:value={startDate}
							disabled={isLoading}
							aria-invalid={!!errors.startDate}
							aria-describedby={errors.startDate ? 'start-date-error' : undefined}
						/>
						{#if errors.startDate}
							<span id="start-date-error" class="error-message" role="alert">
								{errors.startDate}
							</span>
						{/if}
					</div>

					<div class="form-group">
						<label for="end-date">End Date *</label>
						<input
							id="end-date"
							type="date"
							bind:value={endDate}
							disabled={isLoading}
							aria-invalid={!!errors.endDate}
							aria-describedby={errors.endDate ? 'end-date-error' : undefined}
						/>
						{#if errors.endDate}
							<span id="end-date-error" class="error-message" role="alert">
								{errors.endDate}
							</span>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Submit buttons -->
			<div class="form-actions">
				<button type="submit" class="submit-btn" disabled={isLoading || !canSubmit}>
					{isLoading ? 'Creating...' : 'Create Show'}
				</button>
				<a href="/" class="cancel-btn">Cancel</a>
			</div>
		</form>
	</div>
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

	.form-card {
		background: white;
		padding: 2.5rem;
		border-radius: 1rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
		color: #1a202c;
	}

	.subtitle {
		margin: 0 0 2rem 0;
		color: #718096;
		font-size: 0.95rem;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.error-banner {
		background: #fed7d7;
		color: #c53030;
		padding: 0.875rem;
		border-radius: 0.5rem;
		font-size: 0.9rem;
		border: 1px solid #fc8181;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		font-weight: 600;
		color: #2d3748;
		font-size: 0.95rem;
	}

	input,
	textarea,
	.select-input {
		padding: 0.75rem 1rem;
		border: 1px solid #cbd5e0;
		border-radius: 0.5rem;
		font-size: 1rem;
		transition: all 0.2s;
		font-family: inherit;
	}

	input:focus,
	textarea:focus,
	.select-input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	input[aria-invalid='true'],
	textarea[aria-invalid='true'] {
		border-color: #fc8181;
	}

	input:disabled,
	textarea:disabled,
	.select-input:disabled {
		background: #f7fafc;
		cursor: not-allowed;
	}

	.error-message {
		color: #c53030;
		font-size: 0.85rem;
		margin-top: -0.25rem;
	}

	/* Genres checkbox grid */
	.genres-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 0.75rem;
		padding: 1rem;
		background: #f7fafc;
		border-radius: 0.5rem;
		border: 1px solid #cbd5e0;
	}

	.genre-checkbox {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-size: 0.9rem;
		color: #2d3748;
		padding: 0.5rem;
		border-radius: 0.375rem;
		transition: background 0.2s;
	}

	.genre-checkbox:hover {
		background: rgba(102, 126, 234, 0.05);
	}

	.genre-checkbox input[type='checkbox'] {
		width: auto;
		padding: 0;
		margin: 0;
		cursor: pointer;
	}

	.genre-label {
		font-weight: 500;
	}

	/* Form row for side-by-side fields */
	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	/* Form actions */
	.form-actions {
		display: flex;
		gap: 1rem;
		margin-top: 1rem;
	}

	.submit-btn {
		flex: 1;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 0.875rem 1.5rem;
		border: none;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}

	.submit-btn:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.submit-btn:active:not(:disabled) {
		transform: translateY(0);
	}

	.submit-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.cancel-btn {
		padding: 0.875rem 1.5rem;
		border: 2px solid #cbd5e0;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		color: #4a5568;
		text-decoration: none;
		cursor: pointer;
		transition: all 0.2s;
		display: inline-block;
		text-align: center;
	}

	.cancel-btn:hover {
		border-color: #a0aec0;
		background: #f7fafc;
	}

	@media (max-width: 768px) {
		.form-card {
			padding: 2rem 1.5rem;
		}

		.form-row {
			grid-template-columns: 1fr;
		}

		.genres-grid {
			grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		}

		h1 {
			font-size: 1.75rem;
		}
	}
</style>
