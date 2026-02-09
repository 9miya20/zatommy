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
				AUTH0_DOMAIN: string;
				AUTH0_AUDIENCE: string;
				AUTH_APP_URL: string;
			};
			context: ExecutionContext;
		}
	}
}

export {};
