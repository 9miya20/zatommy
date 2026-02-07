<script lang="ts">
	import { goto } from '$app/navigation';
	import { api, type Memo, type Folder } from '$lib/api.js';
	import MemoList from '$lib/components/MemoList.svelte';
	import FolderTree from '$lib/components/FolderTree.svelte';

	let { data } = $props();

	let memos = $state<Memo[]>([]);
	let folders = $state<Folder[]>([]);
	let selectedFolderId = $state<number | undefined>(undefined);
	let searchQuery = $state('');
	let loading = $state(true);
	let totalMemos = $state(0);
	let page = $state(1);

	$effect(() => {
		if (!data.user) {
			goto('/auth/login');
			return;
		}
		loadData();
	});

	async function loadData() {
		loading = true;
		try {
			const [memosRes, foldersRes] = await Promise.all([
				searchQuery
					? api.memos.search(searchQuery, page)
					: api.memos.list(page, 20, selectedFolderId),
				api.folders.list()
			]);
			memos = memosRes.data ?? [];
			totalMemos = memosRes.meta?.total ?? 0;
			folders = foldersRes.data ?? [];
		} finally {
			loading = false;
		}
	}

	async function handleCreateMemo() {
		const res = await api.memos.create({ title: '無題のメモ', folderId: selectedFolderId ?? null });
		if (res.data) {
			await goto(`/memos/${res.data.id}`);
		}
	}

	async function handleDeleteMemo(id: number) {
		await api.memos.delete(id);
		await loadData();
	}

	function handleSelectFolder(folderId: number | undefined) {
		selectedFolderId = folderId;
		page = 1;
		loadData();
	}

	let searchTimer: ReturnType<typeof setTimeout>;
	function handleSearch(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		searchQuery = value;
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => {
			page = 1;
			loadData();
		}, 300);
	}

	async function handleLogout() {
		await api.auth.logout();
		goto('/auth/login');
	}
</script>

<div class="layout">
	<aside class="sidebar">
		<div class="sidebar-header">
			<h2>That Me</h2>
			<button class="icon-btn" onclick={handleLogout} title="ログアウト">↩</button>
		</div>
		<button class="new-memo-btn" onclick={handleCreateMemo}>+ 新規メモ</button>
		<FolderTree {folders} {selectedFolderId} onSelect={handleSelectFolder} />
	</aside>

	<main class="content">
		<div class="toolbar">
			<input
				type="search"
				placeholder="メモを検索..."
				value={searchQuery}
				oninput={handleSearch}
				class="search-input"
			/>
			<span class="memo-count">{totalMemos} 件</span>
		</div>

		{#if loading}
			<div class="loading">読み込み中...</div>
		{:else if memos.length === 0}
			<div class="empty">
				{searchQuery ? '検索結果がありません' : 'メモがありません。新規作成してください。'}
			</div>
		{:else}
			<MemoList {memos} onDelete={handleDeleteMemo} />
		{/if}
	</main>
</div>

<style>
	.layout {
		display: flex;
		min-height: 100vh;
	}

	.sidebar {
		width: 260px;
		background: white;
		border-right: 1px solid #e9ecef;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		flex-shrink: 0;
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.sidebar-header h2 {
		font-size: 1.125rem;
		font-weight: 700;
	}

	.icon-btn {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1.125rem;
		padding: 0.25rem;
		color: #6c757d;
	}

	.new-memo-btn {
		width: 100%;
		padding: 0.5rem;
		background: #212529;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		cursor: pointer;
		transition: opacity 0.15s;
	}

	.new-memo-btn:hover {
		opacity: 0.9;
	}

	.content {
		flex: 1;
		padding: 1.5rem;
		overflow-y: auto;
	}

	.toolbar {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.search-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border: 1px solid #dee2e6;
		border-radius: 8px;
		font-size: 0.875rem;
		outline: none;
		max-width: 400px;
	}

	.search-input:focus {
		border-color: #495057;
	}

	.memo-count {
		color: #6c757d;
		font-size: 0.875rem;
		white-space: nowrap;
	}

	.loading,
	.empty {
		text-align: center;
		color: #6c757d;
		padding: 3rem 1rem;
	}
</style>
