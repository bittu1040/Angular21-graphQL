import { Component, inject, signal, OnInit, linkedSignal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NavigationComponent } from '../../shared/components/navigation/navigation.component';
import { AuthResponse } from '../../core/models/user.model';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, NavigationComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly dashboardData = signal<AuthResponse | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  userId= signal(1);
  selectedUserId= linkedSignal(() => this.userId());

  userId1= signal(10);
  selectedUserId1= computed(() => this.userId1());

  ngOnInit(): void {
    this.loadDashboard();
    this.selectedUserId.set(25);
    this.userId.set(15);

    // this.selectedUserId1.set(35);
    this.userId1.set(30);
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.authService.getDashboard().subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load dashboard');
        this.isLoading.set(false);
      },
    });
  }

  onLogout(): void {
    this.authService.logout().subscribe();
  }

  getCurrentDate(): Date {
    return new Date();
  }

  getUserFirstName(): string {
    const user = this.authService.user();
    return user?.name?.split(' ')[0] || 'User';
  }
}
