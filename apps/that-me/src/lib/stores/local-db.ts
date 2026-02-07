import { openDB, type IDBPDatabase } from 'idb';

export interface LocalMemo {
	id: number;
	title: string;
	content: string;
	folderId: number | null;
	updatedAt: string;
	synced: boolean;
	deleted: boolean;
	localId?: string;
}

export interface LocalFolder {
	id: number;
	name: string;
	parentFolderId: number | null;
}

const DB_NAME = 'that-me';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
	if (!dbPromise) {
		dbPromise = openDB(DB_NAME, DB_VERSION, {
			upgrade(db) {
				if (!db.objectStoreNames.contains('memos')) {
					const memoStore = db.createObjectStore('memos', { keyPath: 'id' });
					memoStore.createIndex('synced', 'synced');
					memoStore.createIndex('folderId', 'folderId');
					memoStore.createIndex('updatedAt', 'updatedAt');
				}
				if (!db.objectStoreNames.contains('folders')) {
					db.createObjectStore('folders', { keyPath: 'id' });
				}
				if (!db.objectStoreNames.contains('pendingOps')) {
					const opsStore = db.createObjectStore('pendingOps', {
						keyPath: 'id',
						autoIncrement: true
					});
					opsStore.createIndex('createdAt', 'createdAt');
				}
			}
		});
	}
	return dbPromise;
}

export const localDb = {
	async getMemos(folderId?: number): Promise<LocalMemo[]> {
		const db = await getDb();
		const all = await db.getAll('memos');
		return all
			.filter((m: LocalMemo) => !m.deleted && (folderId === undefined || m.folderId === folderId))
			.sort((a: LocalMemo, b: LocalMemo) => b.updatedAt.localeCompare(a.updatedAt));
	},

	async getMemo(id: number): Promise<LocalMemo | undefined> {
		const db = await getDb();
		return db.get('memos', id);
	},

	async saveMemo(memo: LocalMemo): Promise<void> {
		const db = await getDb();
		await db.put('memos', memo);
	},

	async deleteMemo(id: number): Promise<void> {
		const db = await getDb();
		const memo = await db.get('memos', id);
		if (memo) {
			await db.put('memos', { ...memo, deleted: true, synced: false });
		}
	},

	async getUnsyncedMemos(): Promise<LocalMemo[]> {
		const db = await getDb();
		const all = await db.getAll('memos');
		return all.filter((m: LocalMemo) => !m.synced);
	},

	async markSynced(id: number): Promise<void> {
		const db = await getDb();
		const memo = await db.get('memos', id);
		if (memo) {
			await db.put('memos', { ...memo, synced: true });
		}
	},

	async bulkSaveMemos(memos: LocalMemo[]): Promise<void> {
		const db = await getDb();
		const tx = db.transaction('memos', 'readwrite');
		for (const memo of memos) {
			await tx.store.put(memo);
		}
		await tx.done;
	},

	async getFolders(): Promise<LocalFolder[]> {
		const db = await getDb();
		return db.getAll('folders');
	},

	async saveFolders(folders: LocalFolder[]): Promise<void> {
		const db = await getDb();
		const tx = db.transaction('folders', 'readwrite');
		await tx.store.clear();
		for (const folder of folders) {
			await tx.store.put(folder);
		}
		await tx.done;
	},

	async addPendingOp(op: { type: string; data: unknown }): Promise<void> {
		const db = await getDb();
		await db.add('pendingOps', { ...op, createdAt: new Date().toISOString() });
	},

	async getPendingOps(): Promise<Array<{ id: number; type: string; data: unknown; createdAt: string }>> {
		const db = await getDb();
		return db.getAllFromIndex('pendingOps', 'createdAt');
	},

	async removePendingOp(id: number): Promise<void> {
		const db = await getDb();
		await db.delete('pendingOps', id);
	}
};
