<script lang="ts">
	import { goto } from '$app/navigation';
	import { api } from '$lib/api.js';

	let email = $state('dev@example.com');
	let loading = $state(false);
	let error = $state('');

	async function handleLogin(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';

		try {
			const res = await api.auth.login(email);
			if (res.error) {
				error = res.error;
			} else {
				await goto('/');
			}
		} catch {
			error = 'ログインに失敗しました';
		} finally {
			loading = false;
		}
	}
</script>

<div class="login-container">
	<div class="login-card">
		<h1>That Me</h1>
		<p class="subtitle">パフォーマンス特化メモアプリ</p>

		{#if error}
			<div class="error">{error}</div>
		{/if}

		<form onsubmit={handleLogin}>
			<label>
				メールアドレス
				<input type="email" bind:value={email} required placeholder="dev@example.com" />
			</label>
			<button type="submit" disabled={loading}>
				{loading ? 'ログイン中...' : 'ログイン'}
			</button>
		</form>
	</div>
</div>

<style>
	.login-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 1rem;
	}

	.login-card {
		background: white;
		border-radius: 12px;
		padding: 2.5rem;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
		width: 100%;
		max-width: 400px;
	}

	h1 {
		font-size: 1.75rem;
		font-weight: 700;
		margin-bottom: 0.25rem;
	}

	.subtitle {
		color: #6c757d;
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 1rem;
	}

	input {
		display: block;
		width: 100%;
		padding: 0.625rem 0.75rem;
		margin-top: 0.25rem;
		border: 1px solid #dee2e6;
		border-radius: 8px;
		font-size: 1rem;
		outline: none;
		transition: border-color 0.15s;
	}

	input:focus {
		border-color: #495057;
	}

	button {
		width: 100%;
		padding: 0.625rem;
		background: #212529;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		cursor: pointer;
		transition: opacity 0.15s;
	}

	button:hover:not(:disabled) {
		opacity: 0.9;
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error {
		background: #fff5f5;
		color: #c92a2a;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}
</style>
