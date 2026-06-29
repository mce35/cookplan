import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, MatIconModule, CommonModule],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <a class="navbar-brand" href="#"><mat-icon style="font-size: 22px; vertical-align: middle; margin-right: 0.4rem;">restaurant_menu</mat-icon>My Cook Book</a>
      <button class="navbar-toggler" type="button" aria-controls="navbarNav" [attr.aria-expanded]="menuOpen" aria-label="Toggle navigation" (click)="toggleMenu()">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" [class.show]="menuOpen" id="navbarNav">
        <ul class="navbar-nav mr-auto">
          <li class="nav-item">
            <a class="nav-link" routerLink="/planning" (click)="menuOpen = false"><mat-icon style="font-size: 18px; vertical-align: middle; margin-right: 0.25rem;">event</mat-icon>Planning</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" routerLink="/recipes" (click)="menuOpen = false"><mat-icon style="font-size: 18px; vertical-align: middle; margin-right: 0.25rem;">restaurant</mat-icon>Recettes</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" routerLink="/ingredients" (click)="menuOpen = false"><mat-icon style="font-size: 18px; vertical-align: middle; margin-right: 0.25rem;">list_alt</mat-icon>Ingrédients</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" routerLink="/shopping-list" (click)="menuOpen = false"><mat-icon style="font-size: 18px; vertical-align: middle; margin-right: 0.25rem;">shopping_cart</mat-icon>Liste de courses</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" routerLink="/search" (click)="menuOpen = false"><mat-icon style="font-size: 18px; vertical-align: middle; margin-right: 0.25rem;">search</mat-icon>Recherche par ingrédient</a>
          </li>
        </ul>
        <ul class="navbar-nav ml-auto">
          <li class="nav-item" *ngIf="isLoggedIn()">
            <a class="nav-link" (click)="logout(); menuOpen = false" style="cursor: pointer;"><mat-icon style="font-size: 18px; vertical-align: middle; margin-right: 0.25rem;">logout</mat-icon>Déconnexion</a>
          </li>
        </ul>
      </div>
    </nav>
    <div class="container-fluid mt-3">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: []
})
export class App {
  name = 'Angular';
  menuOpen = false;

  constructor(private apiService: ApiService, private router: Router) {}

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  isLoggedIn(): boolean {
    return !!this.apiService.getToken();
  }

  logout(): void {
    this.apiService.logout();
    this.router.navigate(['/login']);
  }
}
