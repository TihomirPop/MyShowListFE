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
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading reviews...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<p class="error-message">{error}</p>
			<button onclick={loadReviews} class="retry-button">Try Again</button>
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
							<button onclick={handleCancelEdit} disabled={isSubmitting} class="cancel-button">
								Cancel
							</button>
						{/if}

						<button onclick={handleSubmit} disabled={!canSubmit || isSubmitting} class="submit-button">
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
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 2px solid #e2e8f0;
	}

	.reviews-section h2 {
		margin: 0 0 1.5rem 0;
		font-size: 1.75rem;
		color: #1a202c;
	}

	.reviews-section h3 {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		color: #2d3748;
	}

	/* Loading/Error states (reuse from home page) */
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

	/* Review form */
	.review-form {
		background: #f7fafc;
		padding: 1.5rem;
		border-radius: 0.75rem;
		margin-bottom: 2rem;
	}

	.review-textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #cbd5e0;
		border-radius: 0.5rem;
		font-family: inherit;
		font-size: 1rem;
		resize: vertical;
		transition: border-color 0.2s;
	}

	.review-textarea:focus {
		outline: none;
		border-color: #667eea;
	}

	.review-textarea:disabled {
		background: #edf2f7;
		cursor: not-allowed;
	}

	.form-footer {
		margin-top: 0.75rem;
	}

	.char-count {
		font-size: 0.875rem;
		color: #718096;
	}

	.char-count.warning {
		color: #f56565;
		font-weight: 600;
	}

	.submit-error {
		color: #c53030;
		font-size: 0.875rem;
		margin: 0.5rem 0;
	}

	.form-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		margin-top: 0.75rem;
	}

	.cancel-button,
	.submit-button {
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.95rem;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
	}

	.cancel-button {
		background: white;
		color: #4a5568;
		border: 1px solid #cbd5e0;
	}

	.cancel-button:hover:not(:disabled) {
		background: #f7fafc;
	}

	.submit-button {
		background: #667eea;
		color: white;
	}

	.submit-button:hover:not(:disabled) {
		background: #5568d3;
	}

	.submit-button:disabled,
	.cancel-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Review cards */
	.review-card {
		background: white;
		padding: 1.5rem;
		border-radius: 0.75rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		margin-bottom: 1rem;
	}

	.review-card.user-review {
		border: 2px solid #667eea;
	}

	.review-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.review-username {
		font-weight: 600;
		color: #2d3748;
	}

	.review-text {
		color: #4a5568;
		line-height: 1.6;
		margin: 0;
		white-space: pre-wrap;
		word-wrap: break-word;
	}

	.review-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 1rem;
	}

	.action-button {
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
	}

	.edit-button {
		background: #edf2f7;
		color: #2d3748;
	}

	.edit-button:hover {
		background: #e2e8f0;
	}

	.delete-button {
		background: #fff5f5;
		color: #c53030;
	}

	.delete-button:hover {
		background: #fed7d7;
	}

	.reviews-list {
		margin-top: 2rem;
	}

	@media (max-width: 768px) {
		.reviews-section {
			margin-top: 2rem;
			padding-top: 1.5rem;
		}

		.review-form {
			padding: 1rem;
		}

		.form-actions {
			flex-direction: column;
		}

		.cancel-button,
		.submit-button {
			width: 100%;
		}
	}
</style>
