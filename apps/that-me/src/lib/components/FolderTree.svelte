<script lang="ts">
	import type { Folder } from '$lib/api.js';

	let {
		folders,
		selectedFolderId,
		onSelect
	}: {
		folders: Folder[];
		selectedFolderId: number | undefined;
		onSelect: (id: number | undefined) => void;
	} = $props();

	let rootFolders = $derived(folders.filter((f) => !f.parentFolderId));

	function getChildren(parentId: number): Folder[] {
		return folders.filter((f) => f.parentFolderId === parentId);
	}
</script>

<nav class="folder-tree">
	<button class="folder-item" class:active={!selectedFolderId} onclick={() => onSelect(undefined)}>
		すべてのメモ
	</button>
	{#each rootFolders as folder (folder.id)}
		<button
			class="folder-item"
			class:active={selectedFolderId === folder.id}
			onclick={() => onSelect(folder.id)}
		>
			{folder.name}
		</button>
		{#each getChildren(folder.id) as child (child.id)}
			<button
				class="folder-item nested"
				class:active={selectedFolderId === child.id}
				onclick={() => onSelect(child.id)}
			>
				{child.name}
			</button>
		{/each}
	{/each}
</nav>

<style>
	.folder-tree {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.folder-item {
		display: block;
		width: 100%;
		text-align: left;
		padding: 0.375rem 0.5rem;
		background: none;
		border: none;
		border-radius: 6px;
		font-size: 0.8125rem;
		cursor: pointer;
		color: #495057;
		transition: background 0.1s;
	}

	.folder-item:hover {
		background: #f1f3f5;
	}

	.folder-item.active {
		background: #e9ecef;
		font-weight: 600;
	}

	.folder-item.nested {
		padding-left: 1.5rem;
	}
</style>
