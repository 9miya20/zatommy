export interface User {
	id: number;
	email: string;
	name: string;
}

export interface AuthProvider {
	getCurrentUser(request: Request, platform: App.Platform): Promise<User | null>;
	login(email: string, platform: App.Platform): Promise<{ user: User; token: string }>;
	logout(token: string, platform: App.Platform): Promise<void>;
}
