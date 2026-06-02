import { Injectable, inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError, BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const apiService = inject(ApiService);
  
  // Get token from localStorage
  const token = localStorage.getItem('token');

  // Clone request and add authorization header if token exists
  if (token && !req.url.includes('/login/') && !req.url.includes('/refresh/')) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // If 401 Unauthorized, try to refresh the token
      if (error.status === 401 && !req.url.includes('/refresh/') && !req.url.includes('/login/')) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return apiService.refresh().pipe(
            switchMap((response) => {
              isRefreshing = false;
              localStorage.setItem('token', response.access_token);
              localStorage.setItem('refreshToken', response.refresh_token);
              refreshTokenSubject.next(response.access_token);

              // Retry the original request with new token
              const newReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${response.access_token}`
                }
              });
              return next(newReq);
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              // If refresh fails, redirect to login
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              router.navigate(['/login']);
              return throwError(() => refreshError);
            })
          );
        }
      } else if (error.status === 401) {
        // If it's a login or refresh endpoint that returns 401, go to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        router.navigate(['/login']);
      }
      
      return throwError(() => error);
    })
  );
};

