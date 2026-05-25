import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../@models/user.model';
import { Router } from '@angular/router';





const STORAGE_KEY = 'family-life-current-user';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly currentUserSignal = signal<User | null>(this.readStoredUser());
  private readonly userUrl = 'http://localhost:8080/users';


  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUserSignal() !== null);

  constructor(private readonly router: Router,
              private readonly http: HttpClient
             ) {}


  login(email: string, password: string): Observable<any> {
    const params = new HttpParams()
    .set('email', email)
    .set('password', password);

    return this.http.get(`${this.userUrl}/login`, { params });
  }

  logout(): void {
    this.currentUserSignal.set(null);

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('isLogin');
    localStorage.removeItem('loginUser');

    this.router.navigate(['/login']);
  }

  register(userData: {  userName: string; email: string; pwd: string;
           avatar: string}): Observable<any> {
    return this.http.post(`${this.userUrl}/register`, userData);
  }

  setCurrentUser(user: User): void {
    this.currentUserSignal.set(user);
    console.log(user)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  private readStoredUser(): User | null {
    const rawUser = localStorage.getItem(STORAGE_KEY);

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as User;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }

}
