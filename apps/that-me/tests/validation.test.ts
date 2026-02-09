import { describe, it, expect } from 'vitest';
import {
	createMemoSchema,
	updateMemoSchema,
	createFolderSchema,
	searchSchema,
	paginationSchema
} from '../src/lib/server/validation.js';

describe('createMemoSchema', () => {
	it('デフォルト値が適用される', () => {
		const result = createMemoSchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.title).toBe('');
			expect(result.data.content).toBe('');
		}
	});

	it('タイトルとコンテンツを受け付ける', () => {
		const result = createMemoSchema.safeParse({
			title: 'テスト',
			content: '# Hello'
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.title).toBe('テスト');
			expect(result.data.content).toBe('# Hello');
		}
	});

	it('500文字超のタイトルを拒否する', () => {
		const result = createMemoSchema.safeParse({ title: 'a'.repeat(501) });
		expect(result.success).toBe(false);
	});

	it('folderIdにnullを許可する', () => {
		const result = createMemoSchema.safeParse({ folderId: null });
		expect(result.success).toBe(true);
	});
});

describe('updateMemoSchema', () => {
	it('部分更新を受け付ける', () => {
		const result = updateMemoSchema.safeParse({ title: '更新後' });
		expect(result.success).toBe(true);
	});

	it('空オブジェクトを受け付ける', () => {
		const result = updateMemoSchema.safeParse({});
		expect(result.success).toBe(true);
	});
});

describe('createFolderSchema', () => {
	it('正常なフォルダ名を受け付ける', () => {
		const result = createFolderSchema.safeParse({ name: 'テストフォルダ' });
		expect(result.success).toBe(true);
	});

	it('空のフォルダ名を拒否する', () => {
		const result = createFolderSchema.safeParse({ name: '' });
		expect(result.success).toBe(false);
	});

	it('200文字超のフォルダ名を拒否する', () => {
		const result = createFolderSchema.safeParse({ name: 'a'.repeat(201) });
		expect(result.success).toBe(false);
	});
});

describe('searchSchema', () => {
	it('正常な検索クエリを受け付ける', () => {
		const result = searchSchema.safeParse({ q: 'テスト' });
		expect(result.success).toBe(true);
	});

	it('空の検索クエリを拒否する', () => {
		const result = searchSchema.safeParse({ q: '' });
		expect(result.success).toBe(false);
	});

	it('500文字超のクエリを拒否する', () => {
		const result = searchSchema.safeParse({ q: 'a'.repeat(501) });
		expect(result.success).toBe(false);
	});
});

describe('paginationSchema', () => {
	it('デフォルト値が適用される', () => {
		const result = paginationSchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.page).toBe(1);
			expect(result.data.limit).toBe(20);
		}
	});

	it('文字列の数値を変換する', () => {
		const result = paginationSchema.safeParse({ page: '2', limit: '50' });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.page).toBe(2);
			expect(result.data.limit).toBe(50);
		}
	});

	it('0以下のページを拒否する', () => {
		const result = paginationSchema.safeParse({ page: 0 });
		expect(result.success).toBe(false);
	});

	it('100超のlimitを拒否する', () => {
		const result = paginationSchema.safeParse({ limit: 101 });
		expect(result.success).toBe(false);
	});
});
