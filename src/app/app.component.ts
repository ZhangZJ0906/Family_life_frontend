import { Component, inject } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './@services/auth.service';
import { Title } from '@angular/platform-browser';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [ RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;
  readonly isLoggedIn = this.authService.isLoggedIn;

  pageTitle = '';

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private titleService: Title, // 👈 注入
  ) {}

  ngOnInit() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let route = this.activatedRoute;
          while (route.firstChild) route = route.firstChild;
          return route.snapshot.data['title'] || '拾期日常';
        }),
      )
      .subscribe((title) => {
        this.pageTitle = title;
        this.titleService.setTitle(title); // 👈 這行就會改瀏覽器分頁標題
      });
  }
}
