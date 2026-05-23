import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, MatIconModule],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <a class="navbar-brand" href="#"><mat-icon style="font-size: 22px; vertical-align: middle; margin-right: 0.4rem;">restaurant_menu</mat-icon>My Cook Book</a>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav mr-auto">
          <li class="nav-item">
            <a class="nav-link" routerLink="/planning"><mat-icon style="font-size: 18px; vertical-align: middle; margin-right: 0.25rem;">event</mat-icon>Planning</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" routerLink="/recipes"><mat-icon style="font-size: 18px; vertical-align: middle; margin-right: 0.25rem;">restaurant</mat-icon>Recettes</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" routerLink="/shopping-list"><mat-icon style="font-size: 18px; vertical-align: middle; margin-right: 0.25rem;">shopping_cart</mat-icon>Liste de courses</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" routerLink="/search"><mat-icon style="font-size: 18px; vertical-align: middle; margin-right: 0.25rem;">search</mat-icon>Recherche par ingrédient</a>
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
}
