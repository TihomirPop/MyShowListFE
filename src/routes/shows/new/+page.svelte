<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { createShowAPI } from '$lib/api/client';
	import ShowForm from '$lib/components/ShowForm.svelte';
	import type { CreateShowFormErrors, CreateShowRequest } from '$lib/types/create-show';
	import {
		isCreateShowSuccess,
		isCreateShowGenresNotFound,
		isCreateShowFailure
	} from '$lib/types/create-show';
	import type { ShowFormData } from '$lib/components/ShowForm.svelte';

	let isLoading = $state(false);
	let errors = $state<CreateShowFormErrors>({});

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
							endDate: formData.endDate
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

	<ShowForm
		mode="create"
		{isLoading}
		{errors}
		onSubmit={handleSubmit}
		onCancel={handleCancel}
	/>
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
</style>
