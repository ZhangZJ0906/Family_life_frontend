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

export const environment = {
  production: false,
<<<<<<< HEAD
  // apiUrl: 'https://labels-biz-sheep-concerning.trycloudflare.com'
   apiUrl: 'http://localhost:8080'

=======
  apiUrl: ' http://localhost:8080',
>>>>>>> origin/ZJ
};
