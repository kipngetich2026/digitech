import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

const IDLE_STORAGE_KEY = 'digitech.auth.idle';
const ACTIVITY_SYNC_MS = 60_000;
const CHECK_INTERVAL_MS = 15_000;

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'wheel'] as const;

@Injectable({ providedIn: 'root' })
export class IdleTimeoutService {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  private readonly idleMs = environment.idleTimeoutMinutes * 60 * 1000;
  private lastActivityAt = 0;
  private lastSyncAt = 0;
  private checkTimer: ReturnType<typeof setInterval> | null = null;
  private started = false;
  private loggingOut = false;

  private readonly onActivity = (): void => this.touch();

  start(): void {
    if (this.started) return;
    this.started = true;

    const stored = this.readLastActivity();
    // Prefer a previously persisted clock (survives reloads while idle).
    this.lastActivityAt = stored ?? Date.now();
    if (stored === null) this.writeLastActivity(this.lastActivityAt);

    for (const event of ACTIVITY_EVENTS) {
      document.addEventListener(event, this.onActivity, {
        passive: true,
        capture: true,
      });
    }

    if (this.checkTimer !== null) {
      clearInterval(this.checkTimer);
    }
    this.checkTimer = setInterval(() => this.check(), CHECK_INTERVAL_MS);
    this.check();
  }

  stop(): void {
    if (!this.started && this.checkTimer === null) return;
    this.started = false;

    for (const event of ACTIVITY_EVENTS) {
      document.removeEventListener(event, this.onActivity, {
        capture: true,
      } as EventListenerOptions);
    }

    if (this.checkTimer !== null) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }

    localStorage.removeItem(IDLE_STORAGE_KEY);
    this.lastActivityAt = 0;
    this.lastSyncAt = 0;
    this.loggingOut = false;
  }

  reset(): void {
    this.noteSessionPersisted();
  }

  noteSessionPersisted(): void {
    this.lastActivityAt = Date.now();
    this.writeLastActivity(this.lastActivityAt);
    this.lastSyncAt = 0;
    this.loggingOut = false;
    if (!this.started) this.start();
  }

  private touch(): void {
    if (!this.auth.isAuthenticated()) return;

    const now = Date.now();
    this.lastActivityAt = now;
    this.writeLastActivity(now);
    this.maybeSyncActivity(now);
  }

  private check(): void {
    if (!this.auth.isAuthenticated()) {
      if (this.started) this.stop();
      return;
    }

    if (!this.started) {
      this.start();
      return;
    }

    const stored = this.readLastActivity();
    if (stored !== null && stored > this.lastActivityAt) {
      this.lastActivityAt = stored;
    } else if (this.lastActivityAt === 0) {
      this.lastActivityAt = stored ?? Date.now();
    }

    if (Date.now() - this.lastActivityAt > this.idleMs) {
      this.forceLogout();
    }
  }

  private forceLogout(): void {
    if (this.loggingOut) return;
    this.loggingOut = true;
    this.toast.info('Signed out due to inactivity');
    this.auth.logout().subscribe({
      next: () => undefined,
      error: () => undefined,
      complete: () => {
        this.loggingOut = false;
        this.stop();
      },
    });
  }

  private maybeSyncActivity(now: number): void {
    if (now - this.lastSyncAt < ACTIVITY_SYNC_MS) return;
    this.lastSyncAt = now;
    this.api.post('/auth/activity', {}).subscribe({ error: () => undefined });
  }

  private readLastActivity(): number | null {
    try {
      const raw = localStorage.getItem(IDLE_STORAGE_KEY);
      if (!raw) return null;
      const value = Number(raw);
      return Number.isFinite(value) && value > 0 ? value : null;
    } catch {
      return null;
    }
  }

  private writeLastActivity(ts: number): void {
    try {
      localStorage.setItem(IDLE_STORAGE_KEY, String(ts));
    } catch {
      // ignore quota / private mode
    }
  }
}
