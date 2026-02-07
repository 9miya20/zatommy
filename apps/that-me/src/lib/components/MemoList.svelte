<script lang="ts">
	import type { Memo } from '$lib/api.js';

	let { memos, onDelete }: { memos: Memo[]; onDelete: (id: number) => void } = $props();

	function formatDate(iso: string): string {
		const d = new Date(iso);
		return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	function truncate(text: string, max: number): string {
		return text.length > max ? text.slice(0, max) + '…' : text;
	}
</script>

<ul class="memo-list">
	{#each memos as memo (memo.id)}
		<li class="memo-item">
			<a href="/memos/{memo.id}" class="memo-link">
				<span class="memo-title">{memo.title || '無題のメモ'}</span>
				<span class="memo-preview">{truncate(memo.content, 80)}</span>
				<span class="memo-date">{formatDate(memo.updatedAt)}</span>
			</a>
			<button class="delete-btn" onclick={() => { if (confirm('このメモを削除しますか？')) onDelete(memo.id); }} title="削除">×</button>
		</li>
	{/each}
</ul>

<style>
	.memo-list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.memo-item {
		display: flex;
		align-items: center;
		background: white;
		border-radius: 8px;
		border: 1px solid #e9ecef;
		transition: box-shadow 0.15s;
	}

	.memo-item:hover {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	}

	.memo-link {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 0.75rem 1rem;
		text-decoration: none;
		color: inherit;
		gap: 0.25rem;
	}

	.memo-title {
		font-weight: 600;
		font-size: 0.9375rem;
	}

	.memo-preview {
		font-size: 0.8125rem;
		color: #6c757d;
	}

	.memo-date {
		font-size: 0.75rem;
		color: #adb5bd;
	}

	.delete-btn {
		background: none;
		border: none;
		color: #adb5bd;
		cursor: pointer;
		font-size: 1.25rem;
		padding: 0.5rem;
		margin-right: 0.5rem;
		border-radius: 4px;
		transition: color 0.15s;
	}

	.delete-btn:hover {
		color: #c92a2a;
	}
</style>
