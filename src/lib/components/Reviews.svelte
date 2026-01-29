<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { getReviewsAPI, addOrUpdateReviewAPI, deleteReviewAPI } from '$lib/api/client';
	import type {
		ReviewDto,
		ReviewMutationResponseNotFound,
		ReviewMutationResponseBadRequest,
		ReviewMutationResponseFailure
	} from '$lib/types/review';
	import { isGetReviewsOk, isReviewMutationOk, isDeleteReviewOk } from '$lib/types/review';
	import { onMount } from 'svelte';

	// Props
	let { showId }: { showId: string } = $props();

	// State
	let reviews = $state<ReviewDto[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let reviewText = $state('');
	let isSubmitting = $state(false);
	let isEditing = $state(false);
	let submitError = $state<string | null>(null);

	// Derived state
	const currentUsername = $derived(authStore.user?.username);
	const userReview = $derived(reviews.find((review) => review.username === currentUsername));
	const hasUserReview = $derived(!!userReview);
	const otherReviews = $derived(reviews.filter((review) => review.username !== currentUsername));
	const canSubmit = $derived(reviewText.trim().length > 0 && reviewText.length <= 10000);

	onMount(async () => {
		await loadReviews();
	});

	async function loadReviews() {
		isLoading = true;
		error = null;

		// Check if user is authenticated
		if (!authStore.token) {
			error = 'Please login to view reviews';
			isLoading = false;
			return;
		}

		const response = await getReviewsAPI(showId, authStore.token);

		if (isGetReviewsOk(response)) {
			reviews = response; // Response is the array directly
		} else {
			error = 'Failed to load reviews';
		}

		isLoading = false;
	}

	async function handleSubmit() {
		if (!canSubmit || !authStore.token) return;

		isSubmitting = true;
		submitError = null;

		const response = await addOrUpdateReviewAPI(showId, reviewText, authStore.token);

		if (isReviewMutationOk(response)) {
			// Reload reviews to get updated list
			await loadReviews();
			reviewText = '';
			isEditing = false;
		} else {
			// Handle all error cases (NotFound, BadRequest, Failure)
			const errorResponse = response as
				| ReviewMutationResponseNotFound
				| ReviewMutationResponseBadRequest
				| ReviewMutationResponseFailure;
			submitError = 'message' in errorResponse ? errorResponse.message : 'Failed to submit review';
		}

		isSubmitting = false;
	}

	async function handleEdit() {
		if (userReview) {
			reviewText = userReview.reviewText;
			isEditing = true;
		}
	}

	function handleCancelEdit() {
		reviewText = '';
		isEditing = false;
		submitError = null;
	}

	async function handleDelete() {
		if (!authStore.token || !confirm('Are you sure you want to delete your review?')) {
			return;
		}

		isSubmitting = true;
		submitError = null;

		const response = await deleteReviewAPI(showId, authStore.token);

		if (isDeleteReviewOk(response)) {
			await loadReviews();
			reviewText = '';
			isEditing = false;
		} else {
			submitError = 'Failed to delete review';
		}

		isSubmitting = false;
	}
</script>

<div class="reviews-section">
	<h2>Reviews</h2>

	{#if isLoading}
		<div class="loading-container">
			<div class="loading-spinner"></div>
			<p>Loading reviews...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<p class="error-message">{error}</p>
			<button onclick={loadReviews} class="btn-primary retry-button">Try Again</button>
		</div>
	{:else}
		<!-- Review form (add or edit) -->
		{#if authStore.token && (!hasUserReview || isEditing)}
			<div class="review-form">
				<h3>{isEditing ? 'Edit Your Review' : 'Write a Review'}</h3>

				<textarea
					bind:value={reviewText}
					placeholder="Share your thoughts about this show..."
					rows="5"
					maxlength="10000"
					disabled={isSubmitting}
					class="review-textarea"
				></textarea>

				<div class="form-footer">
					<span class="char-count" class:warning={reviewText.length > 9500}>
						{reviewText.length} / 10,000
					</span>

					{#if submitError}
						<p class="submit-error">{submitError}</p>
					{/if}

					<div class="form-actions">
						{#if isEditing}
							<button onclick={handleCancelEdit} disabled={isSubmitting} class="btn-secondary">
								Cancel
							</button>
						{/if}

						<button onclick={handleSubmit} disabled={!canSubmit || isSubmitting} class="btn-primary">
							{isSubmitting ? 'Submitting...' : isEditing ? 'Update Review' : 'Submit Review'}
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- User's review (if exists and not editing) -->
		{#if userReview && !isEditing}
			<div class="review-card user-review">
				<div class="review-header">
					<span class="review-username">{userReview.username} (You)</span>
				</div>
				<p class="review-text">{userReview.reviewText}</p>
				<div class="review-actions">
					<button onclick={handleEdit} class="action-button edit-button"> ✏️ Edit </button>
					<button onclick={handleDelete} class="action-button delete-button"> 🗑️ Delete </button>
				</div>
			</div>
		{/if}

		<!-- Other reviews -->
		{#if otherReviews.length > 0}
			<div class="reviews-list">
				<h3>Other Reviews</h3>
				{#each otherReviews as review (review.username)}
					<div class="review-card">
						<div class="review-header">
							<span class="review-username">{review.username}</span>
						</div>
						<p class="review-text">{review.reviewText}</p>
					</div>
				{/each}
			</div>
		{/if}

		{#if reviews.length === 0}
			<div class="empty-state">
				<p>No reviews yet.</p>
				<p class="hint">Be the first to review this show!</p>
			</div>
		{/if}
	{/if}
</div>

<style>
	.reviews-section {
		margin-top: var(--space-12);
		padding-top: var(--space-8);
		border-top: 2px solid var(--color-border-light);
	}

	.reviews-section h2 {
		margin: 0 0 var(--space-6) 0;
		font-size: 1.75rem;
		color: var(--color-dark);
	}

	.reviews-section h3 {
		margin: 0 0 var(--space-4) 0;
		font-size: var(--font-size-xl);
		color: var(--color-dark-medium);
	}

	.error-state {
		text-align: center;
		padding: var(--space-8);
		background: var(--color-error-bg);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-error-border);
	}

	.error-message {
		color: var(--color-error);
		margin: 0 0 var(--space-4) 0;
	}

	.empty-state p {
		margin: var(--space-2) 0;
		color: var(--color-gray);
	}

	.empty-state .hint {
		font-size: 0.9rem;
		color: var(--color-gray-light);
	}

	/* Review form */
	.review-form {
		background: var(--color-bg-light);
		padding: var(--space-6);
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-8);
	}

	.review-textarea {
		width: 100%;
		padding: var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-family: inherit;
		font-size: var(--font-size-base);
		resize: vertical;
		transition: border-color var(--transition-base);
	}

	.review-textarea:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.review-textarea:disabled {
		background: #edf2f7;
		cursor: not-allowed;
	}

	.form-footer {
		margin-top: var(--space-3);
	}

	.char-count {
		font-size: var(--font-size-sm);
		color: var(--color-gray);
	}

	.char-count.warning {
		color: #f56565;
		font-weight: 600;
	}

	.submit-error {
		color: var(--color-error);
		font-size: var(--font-size-sm);
		margin: var(--space-2) 0;
	}

	.form-actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
		margin-top: var(--space-3);
	}

	/* Review cards */
	.review-card {
		background: var(--color-white);
		padding: var(--space-6);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
		margin-bottom: var(--space-4);
	}

	.review-card.user-review {
		border: 2px solid var(--color-primary);
	}

	.review-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-3);
	}

	.review-username {
		font-weight: 600;
		color: var(--color-dark-medium);
	}

	.review-text {
		color: var(--color-dark-light);
		line-height: 1.6;
		margin: 0;
		white-space: pre-wrap;
		word-wrap: break-word;
	}

	.review-actions {
		display: flex;
		gap: var(--space-3);
		margin-top: var(--space-4);
	}

	.action-button {
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		font-weight: 600;
		cursor: pointer;
		transition: all var(--transition-base);
		border: none;
	}

	.edit-button {
		background: #edf2f7;
		color: var(--color-dark-medium);
	}

	.edit-button:hover {
		background: var(--color-border-light);
	}

	.delete-button {
		background: var(--color-error-bg);
		color: var(--color-error);
	}

	.delete-button:hover {
		background: var(--color-error-light);
	}

	.reviews-list {
		margin-top: var(--space-8);
	}

	@media (max-width: 768px) {
		.reviews-section {
			margin-top: var(--space-8);
			padding-top: var(--space-6);
		}

		.review-form {
			padding: var(--space-4);
		}

		.form-actions {
			flex-direction: column;
		}
	}
</style>
