interface ApiResponse<T> {
	data?: T;
	error?: string;
	meta?: { total: number; page: number; limit: number };
}

async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
	const res = await fetch(path, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...options?.headers
		}
	});
	return res.json();
}

export interface Memo {
	id: number;
	title: string;
	content: string;
	ownerId: number;
	folderId: number | null;
	createdAt: string;
	updatedAt: string;
}

export interface Folder {
	id: number;
	name: string;
	ownerId: number;
	parentFolderId: number | null;
	createdAt: string;
	updatedAt: string;
}

export interface User {
	id: number;
	email: string;
	name: string;
}

export const api = {
	auth: {
		login(email: string) {
			return request<never>('/auth/login', {
				method: 'POST',
				body: JSON.stringify({ email })
			});
		},
		logout() {
			return request<never>('/auth/login', { method: 'DELETE' });
		}
	},
	memos: {
		list(page = 1, limit = 20, folderId?: number) {
			const params = new URLSearchParams({ page: String(page), limit: String(limit) });
			if (folderId) params.set('folderId', String(folderId));
			return request<Memo[]>(`/api/memos?${params}`);
		},
		get(id: number) {
			return request<Memo>(`/api/memos/${id}`);
		},
		create(data: { title?: string; content?: string; folderId?: number | null }) {
			return request<Memo>('/api/memos', {
				method: 'POST',
				body: JSON.stringify(data)
			});
		},
		update(id: number, data: { title?: string; content?: string; folderId?: number | null }) {
			return request<Memo>(`/api/memos/${id}`, {
				method: 'PATCH',
				body: JSON.stringify(data)
			});
		},
		delete(id: number) {
			return request<never>(`/api/memos/${id}`, { method: 'DELETE' });
		},
		search(q: string, page = 1, limit = 20) {
			const params = new URLSearchParams({ q, page: String(page), limit: String(limit) });
			return request<Memo[]>(`/api/memos/search?${params}`);
		}
	},
	folders: {
		list() {
			return request<Folder[]>('/api/folders');
		},
		create(data: { name: string; parentFolderId?: number | null }) {
			return request<Folder>('/api/folders', {
				method: 'POST',
				body: JSON.stringify(data)
			});
		},
		update(id: number, data: { name?: string; parentFolderId?: number | null }) {
			return request<Folder>(`/api/folders/${id}`, {
				method: 'PATCH',
				body: JSON.stringify(data)
			});
		},
		delete(id: number) {
			return request<never>(`/api/folders/${id}`, { method: 'DELETE' });
		}
	}
};
