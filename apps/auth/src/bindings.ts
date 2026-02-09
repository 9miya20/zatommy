export interface Env {
	KV: KVNamespace;
	AUTH0_DOMAIN: string;
	AUTH0_CLIENT_ID: string;
	AUTH0_CLIENT_SECRET: string;
	AUTH0_AUDIENCE: string;
	ALLOWED_REDIRECT_URIS: string;
}
