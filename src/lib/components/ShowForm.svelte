<script lang="ts">
	import { ALLOWED_GENRES, type ShowDto } from '$lib/types/show';
	import type { ShowType } from '$lib/types/create-show';
	import { getPlaceholderGradient } from '$lib/utils/show';

	// Form data structure that will be passed to onSubmit
	export interface ShowFormData {
		showType: ShowType;
		title: string;
		description: string;
		thumbnailUrl: string;
		selectedGenres: Set<string>;
		releaseDate: string;
		episodeCount: number | '';
		startDate: string;
		endDate: string;
	}

	// Form errors structure
	export interface ShowFormErrors {
		title?: string;
		description?: string;
		thumbnailUrl?: string;
		genres?: string;
		releaseDate?: string;
		episodeCount?: string;
		startDate?: string;
		endDate?: string;
		general?: string;
	}

	// Component props
	interface Props {
		mode: 'create' | 'edit';
		initialData: ShowDto | null;
		isLoading: boolean;
		errors: ShowFormErrors;
		onSubmit: (formData: ShowFormData) => void;
		onCancel: () => void;
	}

	let { mode, initialData, isLoading, errors, onSubmit, onCancel }: Props = $props();

	// Initialize form state
	let showType = $state<ShowType>(initialData?.type || 'MOVIE');
	let title = $state(initialData?.title || '');
	let description = $state(initialData?.description || '');
	let thumbnailUrl = $state(initialData?.thumbnailUrl || '');
	let selectedGenres = $state<Set<string>>(new Set(initialData?.genres || []));

	// Movie-specific fields
	let releaseDate = $state(
		initialData?.type === 'MOVIE' ? initialData.releaseDate.split('T')[0] : ''
	);

	// TV Series-specific fields
	let episodeCount = $state<number | ''>(
		initialData?.type === 'TV_SERIES' && initialData.episodeCount !== null
			? initialData.episodeCount
			: ''
	);
	let startDate = $state(
		initialData?.type === 'TV_SERIES' && initialData.startDate
			? initialData.startDate.split('T')[0]
			: ''
	);
	let endDate = $state(
		initialData?.type === 'TV_SERIES' && initialData.endDate
			? initialData.endDate.split('T')[0]
			: ''
	);

	// Thumbnail preview state
	let previewImageError = $state(false);
	let lastThumbnailUrl = $state('');

	function handlePreviewImageError() {
		previewImageError = true;
	}

	// Track URL changes and reset error state
	$effect(() => {
		if (thumbnailUrl !== lastThumbnailUrl) {
			lastThumbnailUrl = thumbnailUrl;
			previewImageError = false;
		}
	});

	// Derived state (computed validation)
	const canSubmit = $derived(
		title.trim().length > 0 &&
			description.trim().length > 0 &&
			thumbnailUrl.trim().length > 0 &&
			selectedGenres.size > 0 &&
			(showType === 'MOVIE'
				? releaseDate.length > 0
				: episodeCount !== '' && startDate.length > 0)
	);

	function handleSubmit(event: Event) {
		event.preventDefault();

		// Pass form data to parent via callback
		onSubmit({
			showType,
			title,
			description,
			thumbnailUrl,
			selectedGenres,
			releaseDate,
			episodeCount,
			startDate,
			endDate
		});
	}

	function handleCancel() {
		onCancel();
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

<div class="form-card">
	<h1>{mode === 'create' ? 'Add New Show' : 'Edit Show'}</h1>
	<p class="subtitle">
		{mode === 'create' ? 'Create a new movie or TV series' : 'Update show details'}
	</p>

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
			<select
				id="show-type"
				bind:value={showType}
				disabled={isLoading || mode === 'edit'}
				class="select-input"
			>
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

		<!-- Thumbnail URL -->
		<div class="form-group">
			<label for="thumbnail-url">Thumbnail URL *</label>
			<input
				id="thumbnail-url"
				type="url"
				bind:value={thumbnailUrl}
				placeholder="https://example.com/image.jpg"
				disabled={isLoading}
				aria-invalid={!!errors.thumbnailUrl}
				aria-describedby={errors.thumbnailUrl ? 'thumbnail-url-error' : undefined}
				maxlength="2048"
				pattern="https?://.+"
			/>
			{#if errors.thumbnailUrl}
				<span id="thumbnail-url-error" class="error-message" role="alert">
					{errors.thumbnailUrl}
				</span>
			{/if}
			<span class="field-hint">
				Recommended: 2:3 aspect ratio image (e.g., 400×600px). Must be HTTP/HTTPS URL.
			</span>

			<!-- Thumbnail Preview -->
			{#if thumbnailUrl.trim().length > 0 && (thumbnailUrl.startsWith('http://') || thumbnailUrl.startsWith('https://'))}
				<div class="thumbnail-preview-container">
					<span class="preview-label">Preview:</span>
					<div class="thumbnail-preview">
						{#if !previewImageError && thumbnailUrl.trim()}
							<img
								src={thumbnailUrl.trim()}
								alt="Thumbnail preview"
								class="preview-image"
								onerror={handlePreviewImageError}
							/>
						{:else}
							<div
								class="preview-placeholder"
								style="background: {getPlaceholderGradient(0)};"
							></div>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- Genres (Checkbox Group) -->
		<div class="form-group">
			<span id="genres-label" class="label">Genres * (select at least one)</span>
			<div class="genres-grid" role="group" aria-labelledby="genres-label">
				{#each ALLOWED_GENRES as genre (genre)}
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
					<label for="end-date">End Date</label>
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
			<button type="submit" class="btn-primary submit-btn" disabled={isLoading || !canSubmit}>
				{isLoading
					? mode === 'create'
						? 'Creating...'
						: 'Saving...'
					: mode === 'create'
						? 'Create Show'
						: 'Save Changes'}
			</button>
			<button type="button" class="btn-secondary cancel-btn" onclick={handleCancel} disabled={isLoading}>
				Cancel
			</button>
		</div>
	</form>
</div>

<style>
	.form-card {
		background: var(--color-white);
		padding: var(--space-10);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-md);
	}

	h1 {
		margin: 0 0 var(--space-2) 0;
		font-size: var(--font-size-3xl);
		color: var(--color-dark);
	}

	.subtitle {
		margin: 0 0 var(--space-8) 0;
		color: var(--color-gray);
		font-size: 0.95rem;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	label,
	.label {
		font-weight: 600;
		color: var(--color-dark-medium);
		font-size: 0.95rem;
	}

	.error-message {
		color: var(--color-error);
		font-size: var(--font-size-sm);
		margin-top: -0.25rem;
	}

	.field-hint {
		color: var(--color-gray);
		font-size: var(--font-size-sm);
		margin-top: -0.25rem;
	}

	/* Genres checkbox grid */
	.genres-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: var(--space-3);
		padding: var(--space-4);
		background: var(--color-bg-light);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
	}

	.genre-checkbox {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		cursor: pointer;
		font-size: 0.9rem;
		color: var(--color-dark-medium);
		padding: var(--space-2);
		border-radius: var(--radius-sm);
		transition: background var(--transition-base);
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
		gap: var(--space-4);
	}

	/* Form actions */
	.form-actions {
		display: flex;
		gap: var(--space-4);
		margin-top: var(--space-4);
	}

	.submit-btn {
		flex: 1;
		padding: 0.875rem var(--space-6);
	}

	.cancel-btn {
		padding: 0.875rem var(--space-6);
	}

	.thumbnail-preview-container {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-top: var(--space-3);
	}

	.preview-label {
		font-weight: 600;
		color: var(--color-dark-light);
		font-size: 0.875rem;
	}

	.thumbnail-preview {
		width: 200px;
		height: 300px;
		border-radius: var(--radius-lg);
		overflow: hidden;
		box-shadow: var(--shadow-md);
		border: 2px solid var(--color-border-light);
	}

	.preview-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.preview-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	@media (max-width: 768px) {
		.form-card {
			padding: var(--space-8) var(--space-6);
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

		.thumbnail-preview {
			width: 150px;
			height: 225px;
		}
	}
</style>
