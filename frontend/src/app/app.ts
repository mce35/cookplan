import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <a class="navbar-brand" href="#">Recettes App</a>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav mr-auto">
          <li class="nav-item">
            <a class="nav-link" routerLink="/planning">Planning</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" routerLink="/recipes">Recettes</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" routerLink="/shopping-list">Liste de courses</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" routerLink="/search">Recherche par ingrédient</a>
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
