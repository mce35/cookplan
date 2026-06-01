import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h1>CookPlan</h1>
        <form (ngSubmit)="login()">
          <div class="form-group">
            <label for="username">Username</label>
            <input
              id="username"
              type="text"
              [(ngModel)]="username"
              name="username"
              class="form-control"
              placeholder="Enter username"
              required
            />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              [(ngModel)]="password"
              name="password"
              class="form-control"
              placeholder="Enter password"
              required
            />
          </div>
          <button type="submit" class="btn btn-primary btn-block">Login</button>
          <div *ngIf="error" class="alert alert-danger mt-3">{{ error }}</div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f5f5f5;
    }
    .login-card {
      background: white;
      padding: 30px;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 400px;
    }
    h1 {
      text-align: center;
      margin-bottom: 30px;
      color: #333;
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #555;
    }
    .form-control {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }
    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
    }
    .btn-block {
      width: 100%;
      margin-top: 10px;
    }
    .btn {
      padding: 10px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }
    .btn-primary {
      background-color: #007bff;
      color: white;
    }
    .btn-primary:hover {
      background-color: #0056b3;
    }
    .alert {
      padding: 10px 15px;
      border-radius: 4px;
    }
    .alert-danger {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';

  constructor(private apiService: ApiService, private router: Router) {}

  login() {
    this.error = '';
    this.apiService.login(this.username, this.password).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.access_token);
        this.router.navigate(['/planning']);
      },
      error: (err) => {
        this.error = 'Invalid username or password';
      }
    });
  }
}
