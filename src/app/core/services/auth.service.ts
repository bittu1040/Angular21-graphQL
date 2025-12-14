import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, map, of } from 'rxjs';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  UsersResponse,
} from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly API_URL = 'https://node-graph-ql-backend.vercel.app/api';

  // State management with signals
  private readonly currentUser = signal<User | null>(null);
  private readonly isAuthenticatedSignal = signal<boolean>(false);
  private readonly isLoadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  // Public computed signals
  readonly user = computed(() => this.currentUser());
  readonly isAuthenticated = computed(() => this.isAuthenticatedSignal());
  readonly isLoading = computed(() => this.isLoadingSignal());
  readonly error = computed(() => this.errorSignal());

  register(data: RegisterRequest): Observable<AuthResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<AuthResponse>(`${this.API_URL}/register`, data).pipe(
      tap(() => {
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        this.errorSignal.set(error.error?.message || 'Registration failed');
        return throwError(() => error);
      })
    );
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<AuthResponse>(`${this.API_URL}/login`, data).pipe(
      tap((response) => {
        this.isAuthenticatedSignal.set(true);
        this.isLoadingSignal.set(false);
        if (response.userId) {
          // Fetch user details after login
          this.getDashboard().subscribe();
        }
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        this.errorSignal.set(error.error?.message || 'Login failed');
        return throwError(() => error);
      })
    );
  }

  logout(): Observable<AuthResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<AuthResponse>(`${this.API_URL}/logout`, {}).pipe(
      tap(() => {
        this.isAuthenticatedSignal.set(false);
        this.currentUser.set(null);
        this.isLoadingSignal.set(false);
        this.router.navigate(['/login']);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        this.errorSignal.set(error.error?.message || 'Logout failed');
        return throwError(() => error);
      })
    );
  }

  getDashboard(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${this.API_URL}/dashboard`).pipe(
      tap((response) => {
        if (response.userId) {
          this.isAuthenticatedSignal.set(true);
          // Also refresh profile when dashboard confirms auth
          this.fetchProfile().subscribe();
        }
      }),
      catchError((error) => {
        this.isAuthenticatedSignal.set(false);
        this.currentUser.set(null);
        return throwError(() => error);
      })
    );
  }

  /**
   * Fetch the authenticated user's profile and set `currentUser`.
   * Backend returns: { id: user._id, name: user.name, email: user.email }
   */
  fetchProfile(): Observable<User> {
    return this.http
      .get<{ user: { id: string; name: string; email: string } }>(`${this.API_URL}/profile`)
      .pipe(
        map((response) => {
          const profile = response.user;
          const user: User = {
            _id: profile.id,
            name: profile.name,
            email: profile.email,
            createdAt: '',
            updatedAt: '',
          };
          return user;
        }),
        tap((user) => {
          this.currentUser.set(user);
          this.isAuthenticatedSignal.set(true);
        }),
        catchError((error) => {
          this.errorSignal.set(error.error?.message || 'Failed to fetch profile');
          // If profile fails, keep auth state conservative
          this.currentUser.set(null);
          this.isAuthenticatedSignal.set(false);
          return throwError(() => error);
        })
      );
  }

  getUsers(): Observable<UsersResponse> {
    return this.http.get<UsersResponse>(`${this.API_URL}/users`).pipe(
      catchError((error) => {
        this.errorSignal.set(error.error?.message || 'Failed to fetch users');
        return throwError(() => error);
      })
    );
  }

  /**
   * Check authentication status with the server
   * This is used by guards to verify if user has valid session
   */
  checkAuthStatus(): Observable<boolean> {
    return this.http.get<AuthResponse>(`${this.API_URL}/dashboard`).pipe(
      map((response) => {
        if (response.userId) {
          this.isAuthenticatedSignal.set(true);
          return true;
        } else {
          this.isAuthenticatedSignal.set(false);
          return false;
        }
      }),
      catchError(() => {
        this.isAuthenticatedSignal.set(false);
        this.currentUser.set(null);
        return of(false);
      })
    );
  }

  clearError(): void {
    this.errorSignal.set(null);
  }
}
