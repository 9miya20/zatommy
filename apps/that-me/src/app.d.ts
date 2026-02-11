/// <reference types="@cloudflare/workers-types" />

declare global {
	namespace App {
		interface Locals {
			user: {
				id: number;
				email: string;
				name: string;
			} | null;
		}
		interface Platform {
			env: {
				DB: D1Database;
				CACHE: KVNamespace;
				AUTH_APP_URL: string;
				AUTH_APP_INTERNAL_URL?: string;
			};
			context: ExecutionContext;
		}
	}
}

export {};
