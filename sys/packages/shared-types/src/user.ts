export interface User {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface LinkedAccount {
  provider: string;
  linkedAt: string;
}

export interface UserProfile extends User {
  providers: string[];
  linkedAccounts: LinkedAccount[];
}

export type OAuthProvider = 'google' | 'github' | 'microsoft' | 'apple' | 'line';
