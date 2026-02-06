/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE_NAME = `that-me-v${version}`;
const ASSETS = [...build, ...files];

// インストール時: 全アセットをキャッシュ
sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(ASSETS))
			.then(() => sw.skipWaiting())
	);
});

// アクティベート時: 古いキャッシュを削除
sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
			.then(() => sw.clients.claim())
	);
});

// フェッチ時: キャッシュ優先→ネットワークフォールバック
sw.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	// APIリクエストはネットワーク優先
	if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) {
		event.respondWith(
			fetch(event.request).catch(() => {
				return new Response(JSON.stringify({ error: 'オフラインです' }), {
					status: 503,
					headers: { 'Content-Type': 'application/json' }
				});
			})
		);
		return;
	}

	// 静的アセットはキャッシュ優先
	if (event.request.method === 'GET') {
		event.respondWith(
			caches.match(event.request).then((cached) => {
				if (cached) return cached;

				return fetch(event.request).then((response) => {
					if (response.status === 200) {
						const clone = response.clone();
						caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
					}
					return response;
				});
			})
		);
	}
});
