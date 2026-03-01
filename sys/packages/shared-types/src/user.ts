export interface User {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface UserProfile extends User {
  providers: string[];
}
