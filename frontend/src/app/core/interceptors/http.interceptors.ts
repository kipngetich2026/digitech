import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { errorMessage } from '../models/api.models';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  const isPublicAuth =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/refresh');
  const isLogout = req.url.includes('/auth/logout');
  const isActivity = req.url.includes('/auth/activity');

  const token = auth.token();
  const authReq =
    token && !isPublicAuth
      ? req.clone({
          setHeaders: { Authorization: `Bearer ${token}` },
        })
      : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) {
        return throwError(() => err);
      }

      if (isPublicAuth || isLogout || isActivity) {
        return throwError(() => err);
      }

      if (!auth.refreshToken()) {
        auth.clearSession();
        return throwError(() => err);
      }

      return auth.refresh().pipe(
        switchMap(() => {
          const refreshed = auth.token();
          return next(
            refreshed
              ? req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${refreshed}`,
                  },
                })
              : req,
          );
        }),
        catchError((refreshError: unknown) => {
          auth.clearSession();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status !== 401) {
        if (err.error instanceof Blob) {
          // Binary error bodies (e.g. failed PDF download) — parse JSON if possible
          err.error
            .text()
            .then((text: string) => {
              try {
                toast.error(errorMessage(JSON.parse(text)));
              } catch {
                toast.error('Download failed');
              }
            })
            .catch(() => toast.error('Download failed'));
        } else {
          toast.error(errorMessage(err.error ?? err));
        }
      }
      return throwError(() => err);
    }),
  );
};
