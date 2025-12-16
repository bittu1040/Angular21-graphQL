import { Component, inject, signal, OnInit, computed, effect } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NavigationComponent } from '../../shared/components/navigation/navigation.component';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-users',
  imports: [CommonModule, DatePipe, NavigationComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  readonly authService = inject(AuthService);

  readonly users = signal<User[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

// I am using this space to learn signal

// Writable signal
  celsius = signal(0);

  // Derived value (auto-calculated)
  fahrenheit = computed(() => (this.celsius() * 9/5) + 32);

  constructor() {
    // Effect — runs whenever celsius changes
    effect(() => {
      console.log("Celsius changed:", this.celsius());
    });
  }

  // Using update() when value depends on the previous value
  increase() {
    this.celsius.update(v => v + 1);
  }

  decrease() {
    this.celsius.update(v => v - 1);
  }

  increaseBy(value: number) {
    this.celsius.update(v => v + value);
  }

  decreaseBy(value: number) {
    this.celsius.update(v => v - value);
  }

  // Using set() when replacing directly
  reset() {
    this.celsius.set(0);
  }

  // For input field
  updateTemp(value: string) {
    this.celsius.set(Number(value));
  }

  ngOnInit(): void {

    


    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.authService.getUsers().subscribe({
      next: (response) => {
        this.users.set(response.users);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load users');
        this.isLoading.set(false);
      },
    });
  }

  onLogout(): void {
    this.authService.logout().subscribe();
  }

  getUserInitials(name: string): string {
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
