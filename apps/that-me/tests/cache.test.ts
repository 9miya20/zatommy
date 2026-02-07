import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCached, invalidateCache } from '../src/lib/server/cache.js';

describe('3階層キャッシュ', () => {
	beforeEach(() => {
		invalidateCache('test-key');
	});

	it('fetcherの結果をキャッシュする', async () => {
		const fetcher = vi.fn().mockResolvedValue({ id: 1, name: 'テスト' });

		const result1 = await getCached('test-key', undefined, fetcher);
		const result2 = await getCached('test-key', undefined, fetcher);

		expect(result1).toEqual({ id: 1, name: 'テスト' });
		expect(result2).toEqual({ id: 1, name: 'テスト' });
		expect(fetcher).toHaveBeenCalledTimes(1);
	});

	it('invalidateCacheでキャッシュを無効化する', async () => {
		const fetcher = vi.fn().mockResolvedValue({ id: 1 });

		await getCached('test-key', undefined, fetcher);
		invalidateCache('test-key');
		await getCached('test-key', undefined, fetcher);

		expect(fetcher).toHaveBeenCalledTimes(2);
	});

	it('KVキャッシュが使われる', async () => {
		const mockKv = {
			get: vi.fn().mockResolvedValue({ id: 1, source: 'kv' }),
			put: vi.fn().mockResolvedValue(undefined),
			delete: vi.fn().mockResolvedValue(undefined)
		};

		const fetcher = vi.fn().mockResolvedValue({ id: 1, source: 'db' });

		const result = await getCached('kv-test', mockKv as unknown as KVNamespace, fetcher);

		expect(result).toEqual({ id: 1, source: 'kv' });
		expect(fetcher).not.toHaveBeenCalled();
		expect(mockKv.get).toHaveBeenCalledWith('kv-test', 'json');
	});

	it('KVがnullならD1にフォールバックする', async () => {
		const mockKv = {
			get: vi.fn().mockResolvedValue(null),
			put: vi.fn().mockResolvedValue(undefined),
			delete: vi.fn().mockResolvedValue(undefined)
		};

		const fetcher = vi.fn().mockResolvedValue({ id: 1, source: 'db' });

		const result = await getCached('fallback-test', mockKv as unknown as KVNamespace, fetcher);

		expect(result).toEqual({ id: 1, source: 'db' });
		expect(fetcher).toHaveBeenCalledTimes(1);
		expect(mockKv.put).toHaveBeenCalled();
	});
});
