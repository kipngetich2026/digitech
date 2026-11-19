import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { IdleTimeoutService } from './core/services/idle-timeout.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly idle = inject(IdleTimeoutService);

  ngOnInit(): void {
    this.idle.start();

    if (this.auth.isAuthenticated()) {
      this.auth.loadMe().subscribe({ error: () => undefined });
    }
  }
}
