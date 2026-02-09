export interface User {
	id: number;
	email: string;
	name: string;
}

export interface AuthProvider {
	getCurrentUser(request: Request, platform: App.Platform): Promise<User | null>;
}
