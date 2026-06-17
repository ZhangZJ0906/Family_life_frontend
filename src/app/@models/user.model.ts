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
  // apiUrl: '/api'
<<<<<<< HEAD
   apiUrl: 'http://localhost:8081'
=======
  apiUrl: 'http://localhost:8081'
>>>>>>> origin/ZJ

};
