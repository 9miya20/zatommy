import { api, type Memo } from '$lib/api.js';
import { localDb, type LocalMemo } from './local-db.js';

function toLocalMemo(memo: Memo, synced = true): LocalMemo {
	return {
		id: memo.id,
		title: memo.title,
		content: memo.content,
		folderId: memo.folderId,
		updatedAt: memo.updatedAt,
		synced,
		deleted: false
	};
}

export async function syncMemos(): Promise<void> {
	if (!navigator.onLine) return;

	try {
		// 1. ローカルの未同期メモをサーバーへプッシュ
		const unsynced = await localDb.getUnsyncedMemos();
		for (const local of unsynced) {
			if (local.deleted) {
				await api.memos.delete(local.id);
				const db = await import('idb').then((m) => m.openDB('that-me', 1));
				await db.delete('memos', local.id);
				continue;
			}

			// Last-Write-Wins: ローカルの変更をサーバーに上書き
			await api.memos.update(local.id, {
				title: local.title,
				content: local.content,
				folderId: local.folderId
			});
			await localDb.markSynced(local.id);
		}

		// 2. サーバーからメモを取得してローカルを更新
		const serverRes = await api.memos.list(1, 1000);
		const serverMemos = serverRes.data ?? [];

		const localMemos = await localDb.getMemos();
		const localMap = new Map(localMemos.map((m) => [m.id, m]));

		const updates: LocalMemo[] = [];
		for (const serverMemo of serverMemos) {
			const local = localMap.get(serverMemo.id);
			if (!local || (local.synced && serverMemo.updatedAt > local.updatedAt)) {
				updates.push(toLocalMemo(serverMemo));
			}
		}

		if (updates.length > 0) {
			await localDb.bulkSaveMemos(updates);
		}

		// 3. フォルダも同期
		const foldersRes = await api.folders.list();
		if (foldersRes.data) {
			await localDb.saveFolders(
				foldersRes.data.map((f) => ({
					id: f.id,
					name: f.name,
					parentFolderId: f.parentFolderId
				}))
			);
		}
	} catch {
		// オフライン時やエラー時は次回同期にリトライ
	}
}

let syncInterval: ReturnType<typeof setInterval> | null = null;

export function startSync(intervalMs = 30_000): void {
	stopSync();
	syncMemos();
	syncInterval = setInterval(syncMemos, intervalMs);

	if (typeof window !== 'undefined') {
		window.addEventListener('online', syncMemos);
	}
}

export function stopSync(): void {
	if (syncInterval) {
		clearInterval(syncInterval);
		syncInterval = null;
	}
	if (typeof window !== 'undefined') {
		window.removeEventListener('online', syncMemos);
	}
}
