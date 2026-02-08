<script lang="ts">
	import type { Folder } from '$lib/api.js';

	let {
		folders,
		selectedFolderId,
		onSelect,
		isCreatingFolder,
		creatingFolderParentId,
		onCreateFolder,
		onCancelCreate,
		onStartCreateSubfolder,
		onRenameFolder,
		onDeleteFolder,
		onCreateMemoInFolder,
		draggingItem,
		onDropOnFolder,
		onDropOnRoot,
		onFolderDragStart,
		onFolderDragEnd
	}: {
		folders: Folder[];
		selectedFolderId: number | undefined;
		onSelect: (id: number | undefined) => void;
		isCreatingFolder: boolean;
		creatingFolderParentId: number | undefined;
		onCreateFolder: (name: string, parentFolderId?: number) => void;
		onCancelCreate: () => void;
		onStartCreateSubfolder: (parentFolderId: number) => void;
		onRenameFolder: (id: number, name: string) => void;
		onDeleteFolder: (id: number) => void;
		onCreateMemoInFolder: (folderId: number) => void;
		draggingItem: { type: 'memo' | 'folder'; id: number } | null;
		onDropOnFolder: (targetFolderId: number) => void;
		onDropOnRoot: () => void;
		onFolderDragStart: (folderId: number) => void;
		onFolderDragEnd: () => void;
	} = $props();

	let rootFolders = $derived(folders.filter((f) => !f.parentFolderId));

	function getChildren(parentId: number): Folder[] {
		return folders.filter((f) => f.parentFolderId === parentId);
	}

	// ドラッグ&ドロップ
	let dropTargetFolderId = $state<number | 'root' | null>(null);

	function isDescendantOf(folderId: number, potentialAncestorId: number): boolean {
		const folder = folders.find((f) => f.id === folderId);
		if (!folder || !folder.parentFolderId) return false;
		if (folder.parentFolderId === potentialAncestorId) return true;
		return isDescendantOf(folder.parentFolderId, potentialAncestorId);
	}

	function isValidDropTarget(targetFolderId: number): boolean {
		if (!draggingItem) return false;
		if (draggingItem.type === 'memo') return true;
		if (draggingItem.id === targetFolderId) return false;
		return !isDescendantOf(targetFolderId, draggingItem.id);
	}

	// インライン作成
	let newFolderName = $state('');
	let createInputEl = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (isCreatingFolder && createInputEl) {
			createInputEl.focus();
		}
	});

	function handleCreateKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && newFolderName.trim()) {
			onCreateFolder(newFolderName.trim(), creatingFolderParentId);
			newFolderName = '';
		} else if (e.key === 'Escape') {
			newFolderName = '';
			onCancelCreate();
		}
	}

	function handleCreateConfirm() {
		if (newFolderName.trim()) {
			onCreateFolder(newFolderName.trim(), creatingFolderParentId);
			newFolderName = '';
		}
	}

	function handleCreateCancel() {
		newFolderName = '';
		onCancelCreate();
	}

	// リネーム
	let renamingFolderId = $state<number | undefined>(undefined);
	let renamingName = $state('');
	let renameInputEl = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (renamingFolderId !== undefined && renameInputEl) {
			renameInputEl.focus();
			renameInputEl.select();
		}
	});

	function startRename(folder: Folder) {
		renamingFolderId = folder.id;
		renamingName = folder.name;
		contextMenu = undefined;
	}

	function handleRenameKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && renamingName.trim() && renamingFolderId !== undefined) {
			onRenameFolder(renamingFolderId, renamingName.trim());
			renamingFolderId = undefined;
			renamingName = '';
		} else if (e.key === 'Escape') {
			renamingFolderId = undefined;
			renamingName = '';
		}
	}

	function handleRenameConfirm() {
		if (renamingName.trim() && renamingFolderId !== undefined) {
			onRenameFolder(renamingFolderId, renamingName.trim());
			renamingFolderId = undefined;
			renamingName = '';
		}
	}

	function handleRenameCancel() {
		renamingFolderId = undefined;
		renamingName = '';
	}

	// コンテキストメニュー
	let contextMenu = $state<{ folderId: number; x: number; y: number; isRoot: boolean } | undefined>(undefined);

	function handleContextMenu(e: MouseEvent, folder: Folder) {
		e.preventDefault();
		const isRoot = !folder.parentFolderId;
		contextMenu = { folderId: folder.id, x: e.clientX, y: e.clientY, isRoot };
	}

	function closeContextMenu() {
		contextMenu = undefined;
	}

	function handleContextCreateMemo() {
		if (contextMenu) {
			onCreateMemoInFolder(contextMenu.folderId);
			contextMenu = undefined;
		}
	}

	function handleContextCreateSubfolder() {
		if (contextMenu) {
			onStartCreateSubfolder(contextMenu.folderId);
			contextMenu = undefined;
		}
	}

	function handleContextRename() {
		if (contextMenu) {
			const folder = folders.find((f) => f.id === contextMenu!.folderId);
			if (folder) startRename(folder);
		}
	}

	function handleContextDelete() {
		if (contextMenu) {
			onDeleteFolder(contextMenu.folderId);
			contextMenu = undefined;
		}
	}
</script>

<svelte:window onclick={closeContextMenu} />

<nav class="folder-tree">
	<button
		class="folder-item"
		class:active={!selectedFolderId}
		class:drop-target={dropTargetFolderId === 'root'}
		onclick={() => onSelect(undefined)}
		ondragover={(e) => {
			if (draggingItem) {
				e.preventDefault();
				dropTargetFolderId = 'root';
			}
		}}
		ondragleave={() => { dropTargetFolderId = null; }}
		ondrop={(e) => {
			e.preventDefault();
			dropTargetFolderId = null;
			onDropOnRoot();
		}}
	>
		すべてのメモ
	</button>

	{#if isCreatingFolder && creatingFolderParentId === undefined}
		<div class="inline-input">
			<input
				bind:this={createInputEl}
				bind:value={newFolderName}
				onkeydown={handleCreateKeydown}
				placeholder="フォルダー名"
				class="folder-name-input"
			/>
			<button class="inline-btn confirm" onclick={handleCreateConfirm} title="作成">&#10003;</button>
			<button class="inline-btn cancel" onclick={handleCreateCancel} title="キャンセル">&#10005;</button>
		</div>
	{/if}

	{#each rootFolders as folder (folder.id)}
		{#if renamingFolderId === folder.id}
			<div class="inline-input">
				<input
					bind:this={renameInputEl}
					bind:value={renamingName}
					onkeydown={handleRenameKeydown}
					class="folder-name-input"
				/>
				<button class="inline-btn confirm" onclick={handleRenameConfirm} title="確定">&#10003;</button>
				<button class="inline-btn cancel" onclick={handleRenameCancel} title="キャンセル">&#10005;</button>
			</div>
		{:else}
			<button
				class="folder-item"
				class:active={selectedFolderId === folder.id}
				class:drop-target={dropTargetFolderId === folder.id}
				class:dragging={draggingItem?.type === 'folder' && draggingItem.id === folder.id}
				draggable="true"
				onclick={() => onSelect(folder.id)}
				oncontextmenu={(e) => handleContextMenu(e, folder)}
				ondragstart={(e) => {
					e.dataTransfer?.setData('text/plain', String(folder.id));
					onFolderDragStart(folder.id);
				}}
				ondragend={() => { onFolderDragEnd(); }}
				ondragover={(e) => {
					if (draggingItem && isValidDropTarget(folder.id)) {
						e.preventDefault();
						dropTargetFolderId = folder.id;
					}
				}}
				ondragleave={() => { dropTargetFolderId = null; }}
				ondrop={(e) => {
					e.preventDefault();
					dropTargetFolderId = null;
					onDropOnFolder(folder.id);
				}}
			>
				{folder.name}
			</button>
		{/if}

		{#each getChildren(folder.id) as child (child.id)}
			{#if renamingFolderId === child.id}
				<div class="inline-input nested">
					<input
						bind:this={renameInputEl}
						bind:value={renamingName}
						onkeydown={handleRenameKeydown}
						class="folder-name-input"
					/>
					<button class="inline-btn confirm" onclick={handleRenameConfirm} title="確定">&#10003;</button>
					<button class="inline-btn cancel" onclick={handleRenameCancel} title="キャンセル">&#10005;</button>
				</div>
			{:else}
				<button
					class="folder-item nested"
					class:active={selectedFolderId === child.id}
					class:drop-target={dropTargetFolderId === child.id}
					class:dragging={draggingItem?.type === 'folder' && draggingItem.id === child.id}
					draggable="true"
					onclick={() => onSelect(child.id)}
					oncontextmenu={(e) => handleContextMenu(e, child)}
					ondragstart={(e) => {
						e.dataTransfer?.setData('text/plain', String(child.id));
						onFolderDragStart(child.id);
					}}
					ondragend={() => { onFolderDragEnd(); }}
					ondragover={(e) => {
						if (draggingItem && isValidDropTarget(child.id)) {
							e.preventDefault();
							dropTargetFolderId = child.id;
						}
					}}
					ondragleave={() => { dropTargetFolderId = null; }}
					ondrop={(e) => {
						e.preventDefault();
						dropTargetFolderId = null;
						onDropOnFolder(child.id);
					}}
				>
					{child.name}
				</button>
			{/if}
		{/each}

		{#if isCreatingFolder && creatingFolderParentId === folder.id}
			<div class="inline-input nested">
				<input
					bind:this={createInputEl}
					bind:value={newFolderName}
					onkeydown={handleCreateKeydown}
					placeholder="サブフォルダー名"
					class="folder-name-input"
				/>
				<button class="inline-btn confirm" onclick={handleCreateConfirm} title="作成">&#10003;</button>
				<button class="inline-btn cancel" onclick={handleCreateCancel} title="キャンセル">&#10005;</button>
			</div>
		{/if}
	{/each}
</nav>

{#if contextMenu}
	<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
	<div
		class="context-menu"
		style="left: {contextMenu.x}px; top: {contextMenu.y}px"
		onclick={(e) => e.stopPropagation()}
	>
		<button class="context-menu-item" onclick={handleContextCreateMemo}>
			フォルダー内にメモを作成
		</button>
		{#if contextMenu.isRoot}
			<button class="context-menu-item" onclick={handleContextCreateSubfolder}>
				サブフォルダーを作成
			</button>
		{/if}
		<button class="context-menu-item" onclick={handleContextRename}>
			名前を変更
		</button>
		<div class="context-menu-divider"></div>
		<button class="context-menu-item danger" onclick={handleContextDelete}>
			削除
		</button>
	</div>
{/if}

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
		transition: background 0.1s, opacity 0.15s;
	}

	.folder-item:hover {
		background: #f1f3f5;
	}

	.folder-item.active {
		background: #e9ecef;
		font-weight: 600;
	}

	.folder-item.drop-target {
		background: #d0ebff;
		outline: 2px solid #339af0;
		outline-offset: -2px;
	}

	.folder-item.dragging {
		opacity: 0.4;
	}

	.folder-item.nested {
		padding-left: 1.5rem;
	}

	.inline-input {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 2px 0.5rem;
	}

	.inline-input.nested {
		padding-left: 1.5rem;
	}

	.folder-name-input {
		flex: 1;
		padding: 0.25rem 0.375rem;
		border: 1px solid #dee2e6;
		border-radius: 4px;
		font-size: 0.8125rem;
		outline: none;
		min-width: 0;
	}

	.folder-name-input:focus {
		border-color: #495057;
	}

	.inline-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.125rem 0.25rem;
		font-size: 0.75rem;
		border-radius: 4px;
		line-height: 1;
		flex-shrink: 0;
	}

	.inline-btn.confirm {
		color: #2b8a3e;
	}

	.inline-btn.confirm:hover {
		background: #ebfbee;
	}

	.inline-btn.cancel {
		color: #c92a2a;
	}

	.inline-btn.cancel:hover {
		background: #fff5f5;
	}

	.context-menu {
		position: fixed;
		background: white;
		border: 1px solid #dee2e6;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		padding: 4px 0;
		min-width: 180px;
		z-index: 1000;
	}

	.context-menu-item {
		display: block;
		width: 100%;
		text-align: left;
		padding: 0.5rem 0.75rem;
		background: none;
		border: none;
		font-size: 0.8125rem;
		cursor: pointer;
		color: #495057;
	}

	.context-menu-item:hover {
		background: #f1f3f5;
	}

	.context-menu-item.danger {
		color: #c92a2a;
	}

	.context-menu-item.danger:hover {
		background: #fff5f5;
	}

	.context-menu-divider {
		height: 1px;
		background: #e9ecef;
		margin: 4px 0;
	}
</style>
