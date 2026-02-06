<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { api, type Memo } from '$lib/api.js';
	import MemoEditor from '$lib/components/MemoEditor.svelte';

	let { data } = $props();

	let memo = $state<Memo | null>(null);
	let loading = $state(true);
	let saving = $state(false);
	let saveTimer: ReturnType<typeof setTimeout>;

	$effect(() => {
		if (!data.user) {
			goto('/auth/login');
			return;
		}
		loadMemo();
	});

	async function loadMemo() {
		loading = true;
		const id = Number(page.params.id);
		const res = await api.memos.get(id);
		memo = res.data ?? null;
		loading = false;
	}

	function autoSave() {
		clearTimeout(saveTimer);
		saveTimer = setTimeout(async () => {
			if (!memo) return;
			saving = true;
			await api.memos.update(memo.id, { title: memo.title, content: memo.content });
			saving = false;
		}, 500);
	}

	function handleTitleChange(value: string) {
		if (!memo) return;
		memo = { ...memo, title: value };
		autoSave();
	}

	function handleContentChange(value: string) {
		if (!memo) return;
		memo = { ...memo, content: value };
		autoSave();
	}

	async function handleDelete() {
		if (!memo) return;
		await api.memos.delete(memo.id);
		await goto('/');
	}
</script>

<div class="page">
	<header class="header">
		<a href="/" class="back-link">← 戻る</a>
		<div class="header-actions">
			{#if saving}
				<span class="save-indicator">保存中...</span>
			{/if}
			<button class="delete-btn" onclick={handleDelete}>削除</button>
		</div>
	</header>

	{#if loading}
		<div class="loading">読み込み中...</div>
	{:else if !memo}
		<div class="not-found">メモが見つかりません</div>
	{:else}
		<div class="editor-container">
			<MemoEditor
				title={memo.title}
				content={memo.content}
				onTitleChange={handleTitleChange}
				onContentChange={handleContentChange}
			/>
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 800px;
		margin: 0 auto;
		padding: 1.5rem;
		min-height: 100vh;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5rem;
	}

	.back-link {
		color: #495057;
		text-decoration: none;
		font-size: 0.875rem;
	}

	.back-link:hover {
		color: #212529;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.save-indicator {
		font-size: 0.75rem;
		color: #6c757d;
	}

	.delete-btn {
		padding: 0.375rem 0.75rem;
		background: none;
		border: 1px solid #dee2e6;
		border-radius: 6px;
		font-size: 0.8125rem;
		cursor: pointer;
		color: #6c757d;
	}

	.delete-btn:hover {
		color: #c92a2a;
		border-color: #c92a2a;
	}

	.editor-container {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
		min-height: 70vh;
	}

	.loading,
	.not-found {
		text-align: center;
		color: #6c757d;
		padding: 3rem 1rem;
	}
</style>
