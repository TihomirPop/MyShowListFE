<script lang="ts">
	import "../app.css";
	import favicon from "$lib/assets/favicon.svg";
	import { authStore } from "$lib/stores/auth.svelte";
	import { beforeNavigate } from "$app/navigation";
	import { goto } from "$app/navigation";

	let { children } = $props();

	const PUBLIC_ROUTES = ["/login", "/register"];

	// Handle navigation between pages
	beforeNavigate(({ to, cancel }) => {
		if (!to) return;

		const isPublicRoute = PUBLIC_ROUTES.some((route) =>
			to.url.pathname.startsWith(route),
		);
		const isAuthenticated = authStore.isAuthenticated;

		// If user is authenticated and trying to access login/register, redirect to home todo: fix bad logic
		if (isAuthenticated && isPublicRoute) {
			cancel();
			goto("/");
			return;
		}

		// If user is not authenticated and trying to access protected route, redirect to login
		if (!isAuthenticated && !isPublicRoute) {
			cancel();
			goto("/login");
			return;
		}
	});

	// Handle initial page load - check if we need to redirect
	$effect(() => {
		if (typeof window !== "undefined") {
			//todo: merge logic?
			const currentPath = window.location.pathname;
			const isPublicRoute = PUBLIC_ROUTES.some((route) =>
				currentPath.startsWith(route),
			);
			const isAuthenticated = authStore.isAuthenticated;

			// If not authenticated and not on a public route, redirect to login
			if (!isAuthenticated && !isPublicRoute) {
				goto("/login");
			}
			// If authenticated and on a public route, redirect to home
			else if (isAuthenticated && isPublicRoute) {
				goto("/");
			}
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if authStore.isAuthenticated}
	<nav class="navbar">
		<div class="nav-container">
			<a href="/" class="nav-brand">MyShowList</a>
			<div class="nav-items">
				{#if authStore.user?.role === 'ADMIN'}
					<a href="/shows/new" class="add-show-btn">Add Show</a>
				{/if}
				<a href="/mylist" class="username-link">{authStore.user?.username}</a>
				<button onclick={() => authStore.logout()} class="logout-btn">
					Logout
				</button>
			</div>
		</div>
	</nav>
{/if}

{@render children()}

<style>
	.navbar {
		background: var(--gradient-primary);
		box-shadow: var(--shadow-sm);
	}

	.nav-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--space-4) var(--space-6);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.nav-brand {
		color: var(--color-white);
		font-size: var(--font-size-2xl);
		font-weight: 700;
		text-decoration: none;
		transition: opacity var(--transition-base);
	}

	.nav-brand:hover {
		opacity: 0.9;
	}

	.nav-items {
		display: flex;
		align-items: center;
		gap: var(--space-6);
	}

	.username-link {
		color: var(--color-white);
		font-weight: 500;
		text-decoration: none;
		transition: opacity var(--transition-base);
		cursor: pointer;
	}

	.username-link:hover {
		opacity: 0.8;
		text-decoration: underline;
	}

	.add-show-btn {
		background: rgba(255, 255, 255, 0.25);
		color: var(--color-white);
		padding: var(--space-2) var(--space-5);
		border-radius: var(--radius-sm);
		font-size: 0.95rem;
		font-weight: 600;
		text-decoration: none;
		transition: background var(--transition-base), transform var(--transition-fast);
		border: 1px solid rgba(255, 255, 255, 0.3);
		display: inline-block;
	}

	.add-show-btn:hover {
		background: rgba(255, 255, 255, 0.35);
		transform: translateY(-1px);
	}

	.add-show-btn:active {
		transform: translateY(0);
	}

	.logout-btn {
		background: rgba(255, 255, 255, 0.2);
		color: var(--color-white);
		border: 1px solid rgba(255, 255, 255, 0.3);
		padding: var(--space-2) var(--space-5);
		border-radius: var(--radius-sm);
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		transition: background var(--transition-base), transform var(--transition-fast);
	}

	.logout-btn:hover {
		background: rgba(255, 255, 255, 0.3);
		transform: translateY(-1px);
	}

	.logout-btn:active {
		transform: translateY(0);
	}

	@media (max-width: 640px) {
		.nav-container {
			padding: 0.875rem var(--space-4);
		}

		.nav-brand {
			font-size: var(--font-size-xl);
		}

		.username-link {
			display: none;
		}

		.add-show-btn {
			padding: var(--space-2) var(--space-4);
			font-size: var(--font-size-sm);
		}

		.logout-btn {
			padding: var(--space-2) var(--space-4);
			font-size: var(--font-size-sm);
		}
	}
</style>
