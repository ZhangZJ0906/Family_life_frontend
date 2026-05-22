export interface User {
  user_id: number;
  name: string;
  email: string;
  password: string;
  avatar: string;
  is_notify_by_enddate: boolean;
  is_notify_by_email: boolean;
  created_at: string;
  updated_at: string;
}
