<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
</script>

<svelte:head>
	<title>Home - MyShowList</title>
</svelte:head>

<div class="container">
	<div class="hero">
		<h1>Hello, {authStore.user?.username}!</h1>
		<p class="hero-text">Welcome to MyShowList - Your personal TV show tracker</p>
	</div>

	<div class="hello-world">
		<h2>Hello World</h2>
		<p>This is your authenticated home page. You're successfully logged in!</p>
	</div>

	<div class="features">
		<div class="feature-card">
			<div class="feature-icon">📺</div>
			<h3>Track Your Shows</h3>
			<p>Keep track of all your favorite TV shows and movies in one place.</p>
		</div>

		<div class="feature-card">
			<div class="feature-icon">⭐</div>
			<h3>Rate & Review</h3>
			<p>Share your thoughts and rate shows to remember what you loved.</p>
		</div>

		<div class="feature-card">
			<div class="feature-icon">📊</div>
			<h3>Track Progress</h3>
			<p>Monitor your watching progress and discover what to watch next.</p>
		</div>

		<div class="feature-card">
			<div class="feature-icon">🔍</div>
			<h3>Discover More</h3>
			<p>Find new shows based on your preferences and viewing history.</p>
		</div>
	</div>

	<div class="getting-started">
		<h2>Getting Started</h2>
		<p>Features are coming soon! This application is currently under development.</p>
		<p>Stay tuned for updates as we build out the full show tracking experience.</p>
	</div>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1.5rem;
	}

	.hero {
		text-align: center;
		margin-bottom: 3rem;
		padding: 2rem 0;
	}

	h1 {
		margin: 0 0 1rem 0;
		font-size: 2.5rem;
		color: #1a202c;
		font-weight: 700;
	}

	.hero-text {
		font-size: 1.25rem;
		color: #718096;
		margin: 0;
	}

	.hello-world {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 2rem;
		border-radius: 1rem;
		margin-bottom: 3rem;
		text-align: center;
		box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
	}

	.hello-world h2 {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
	}

	.hello-world p {
		margin: 0;
		font-size: 1.1rem;
		opacity: 0.95;
	}

	.features {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		margin-bottom: 3rem;
	}

	.feature-card {
		background: white;
		padding: 2rem;
		border-radius: 0.75rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s, box-shadow 0.2s;
		text-align: center;
	}

	.feature-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
	}

	.feature-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.feature-card h3 {
		margin: 0 0 0.75rem 0;
		color: #2d3748;
		font-size: 1.25rem;
	}

	.feature-card p {
		margin: 0;
		color: #718096;
		line-height: 1.6;
	}

	.getting-started {
		background: #f7fafc;
		padding: 2rem;
		border-radius: 0.75rem;
		text-align: center;
		border: 2px dashed #cbd5e0;
	}

	.getting-started h2 {
		margin: 0 0 1rem 0;
		color: #2d3748;
	}

	.getting-started p {
		margin: 0.5rem 0;
		color: #718096;
		line-height: 1.6;
	}

	@media (max-width: 768px) {
		.container {
			padding: 1.5rem 1rem;
		}

		h1 {
			font-size: 2rem;
		}

		.hero-text {
			font-size: 1.1rem;
		}

		.hello-world h2 {
			font-size: 1.5rem;
		}

		.features {
			grid-template-columns: 1fr;
		}
	}
</style>
