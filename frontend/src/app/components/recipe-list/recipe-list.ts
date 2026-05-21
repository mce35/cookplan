import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Recipe } from '../../models/models';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>Liste des Recettes ({{ recipes().length }})</h2>
        <a routerLink="/recipes/new" class="btn btn-primary">Ajouter une recette</a>
      </div>

      <div *ngIf="recipes().length === 0" class="alert alert-info">
        Aucune recette trouvée.
      </div>

      <div class="row">
        <div class="col-md-4 mb-4" *ngFor="let recipe of recipes()">
          <div class="card h-100 shadow-sm">
            <div class="card-body">
              <h5 class="card-title text-primary">{{ recipe.name }}</h5>
              <span class="badge badge-secondary mb-2">{{ recipe.recipe_type }}</span>
              <p class="card-text">
                <small class="text-muted">
                  Prép: {{ recipe.prep_time }} min | Cuisson: {{ recipe.cook_time }} min
                </small>
              </p>
              <div class="mt-3">
                <a [routerLink]="['/recipes', recipe.id]" class="btn btn-sm btn-outline-info mr-2">Voir</a>
                <a [routerLink]="['/recipes', recipe.id, 'edit']" class="btn btn-sm btn-outline-warning">Editer</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card { transition: transform 0.2s; }
    .card:hover { transform: translateY(-5px); }
  `]
})
export class RecipeListComponent implements OnInit {
  recipes = signal<Recipe[]>([]);

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getRecipes().subscribe({
      next: (data) => {
        console.log('Recipes loaded successfully:', data);
        this.recipes.set(data);
      },
      error: (err) => {
        console.error('Error loading recipes:', err);
      }
    });
  }
}
