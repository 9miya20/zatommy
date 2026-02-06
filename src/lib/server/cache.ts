/**
 * 3階層キャッシュ: Memory Cache → Cloudflare KV → D1
 *
 * Memory Cache: <1ms, 60秒TTL
 * KV Cache: <5ms, 300秒TTL
 * D1: <30ms, 永続
 */

interface CacheEntry<T> {
	data: T;
	expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

const MEMORY_TTL = 60_000; // 60秒
const KV_TTL = 300; // 300秒

function getFromMemory<T>(key: string): T | null {
	const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
	if (!entry) return null;
	if (Date.now() > entry.expiresAt) {
		memoryCache.delete(key);
		return null;
	}
	return entry.data;
}

function setToMemory<T>(key: string, data: T): void {
	memoryCache.set(key, { data, expiresAt: Date.now() + MEMORY_TTL });

	// メモリリーク防止: 1000エントリ超えたらLRU的に古いものを削除
	if (memoryCache.size > 1000) {
		const firstKey = memoryCache.keys().next().value;
		if (firstKey !== undefined) {
			memoryCache.delete(firstKey);
		}
	}
}

export async function getCached<T>(
	key: string,
	kv: KVNamespace | undefined,
	fetcher: () => Promise<T>
): Promise<T> {
	// L1: Memory
	const memResult = getFromMemory<T>(key);
	if (memResult !== null) return memResult;

	// L2: KV
	if (kv) {
		try {
			const kvResult = await kv.get(key, 'json');
			if (kvResult !== null) {
				const data = kvResult as T;
				setToMemory(key, data);
				return data;
			}
		} catch {
			// KV読み取りエラーは無視してD1にフォールバック
		}
	}

	// L3: D1 (fetcher)
	const data = await fetcher();

	// キャッシュに書き戻し
	setToMemory(key, data);
	if (kv) {
		// ノンブロッキングで書き込み
		kv.put(key, JSON.stringify(data), { expirationTtl: KV_TTL }).catch(() => {});
	}

	return data;
}

export function invalidateCache(key: string, kv?: KVNamespace): void {
	memoryCache.delete(key);
	if (kv) {
		kv.delete(key).catch(() => {});
	}
}

export function invalidateCacheByPrefix(prefix: string, kv?: KVNamespace): void {
	for (const key of memoryCache.keys()) {
		if (key.startsWith(prefix)) {
			memoryCache.delete(key);
		}
	}
	// KVはprefix削除が効率的にできないため、個別削除は呼び出し側で行う
}
