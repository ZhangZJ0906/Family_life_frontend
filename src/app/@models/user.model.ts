export interface User {
  user_id: number;
  name: string;
  email: string;
  password: string;
  avatar: string;
  notifyByEndDate: boolean;
  notifyByEmail: boolean;
  created_at?: string;
  updated_at?: string;
}
