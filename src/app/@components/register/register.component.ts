import { Component } from '@angular/core';
import { AuthService } from '../../@services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  name = '';
  email = '';
  password = '';
  avatar = '';
  is_notify: boolean = true;

  register(): void {
    if (!this.email || !this.name || !this.password ) {
      alert('請完整填寫 姓名、Email、密碼');
      return;
    }

    this.authService.register({
      email: this.email,
      name: this.name,
      password: this.password,
      avatar: this.avatar ?? '',
      is_notify: this.is_notify ?? true
    }).subscribe({
      next: (res) => {
        if (res.code === 200) {
          alert('註冊成功');
          this.router.navigate(['/log-in']);
          return;
        }
        alert(res.message ?? '註冊失敗');
      },
      error: (err) => {
        console.error(err);
        alert('註冊失敗');
      }
    });
  }


}
