export interface User {
  user_id: number;
  name: string;
  email: string;
  password: string;
  avatar: string;
<<<<<<< HEAD
  is_notify_by_enddate: boolean;
  is_notify_by_email: boolean;
  created_at: string;
  updated_at: string;
=======
  notifyByEndDate: boolean;
  notifyByEmail: boolean;
  created_at?: string;
  updated_at?: string;
>>>>>>> origin/ZJ
}
