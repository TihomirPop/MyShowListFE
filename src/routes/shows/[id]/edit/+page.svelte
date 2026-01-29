<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { updateShowAPI } from '$lib/api/client';
	import ShowForm from '$lib/components/ShowForm.svelte';
	import type {
		UpdateShowFormErrors,
		UpdateShowRequest
	} from '$lib/types/update-show';
	import {
		isUpdateShowSuccess,
		isUpdateShowNotFound,
		isUpdateShowGenresNotFound,
		isUpdateShowFailure
	} from '$lib/types/update-show';
	import type { ShowFormData } from '$lib/components/ShowForm.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let isLoading = $state(false);
	let errors = $state<UpdateShowFormErrors>({});

	async function handleSubmit(formData: ShowFormData) {
		errors = {};

		if (!authStore.token) {
			errors = { general: 'Not authenticated' };
			return;
		}

		isLoading = true;

		try {
			// Build polymorphic request based on showType
			const request: UpdateShowRequest =
				formData.showType === 'MOVIE'
					? {
							id: data.show.id,
							type: 'MOVIE',
							title: formData.title.trim(),
							description: formData.description.trim(),
							thumbnailUrl: formData.thumbnailUrl.trim(),
							genres: Array.from(formData.selectedGenres),
							releaseDate: formData.releaseDate
						}
					: {
							id: data.show.id,
							type: 'TV_SERIES',
							title: formData.title.trim(),
							description: formData.description.trim(),
							thumbnailUrl: formData.thumbnailUrl.trim(),
							genres: Array.from(formData.selectedGenres),
							episodeCount: Number(formData.episodeCount),
							startDate: formData.startDate,
							endDate: formData.endDate
						};

			const response = await updateShowAPI(data.show.id, request, authStore.token);

			// Pattern match response (DOP)
			if (isUpdateShowSuccess(response)) {
				goto(`/shows/${data.show.id}`);
				return;
			}

			if (isUpdateShowNotFound(response)) {
				errors = { general: 'Show not found. It may have been deleted.' };
				return;
			}

			if (isUpdateShowGenresNotFound(response)) {
				// TypeScript narrowing - explicit assertion after guard
				const genresResponse = response as import('$lib/types/update-show').UpdateShowResponseGenresNotFound;
				errors = {
					genres: `The following genres do not exist: ${genresResponse.missingGenres.join(', ')}`
				};
				return;
			}

			if (isUpdateShowFailure(response)) {
				// TypeScript narrowing - explicit assertion after guard
				const failureResponse = response as import('$lib/types/update-show').UpdateShowResponseFailure;
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
		goto(`/shows/${data.show.id}`);
	}
</script>

<svelte:head>
	<title>Edit {data.show.title} - MyShowList</title>
</svelte:head>

<div class="container">
	<nav class="breadcrumb">
		<a href="/">Home</a>
		<span class="separator">/</span>
		<a href="/shows/{data.show.id}">{data.show.title}</a>
		<span class="separator">/</span>
		<span class="current">Edit</span>
	</nav>

	<ShowForm
		mode="edit"
		initialData={data.show}
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
</style>
