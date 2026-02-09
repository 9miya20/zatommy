export interface AuthUser {
	sub: string;
	email: string;
	name: string;
}

export interface JwtVerifyOptions {
	jwks: import('jose').FlattenedJWSInput | any;
	audience: string;
	issuer: string;
}
