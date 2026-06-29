import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Recipe } from '../../models/models';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap">
        <div>
          <h2>Liste des Recettes ({{ filteredRecipes().length }} / {{ totalCount() }})</h2>
        </div>
        <div class="form-group mb-2 mr-3" style="min-width: 220px;">
          <input type="text" class="form-control form-control-sm" placeholder="Filtrer par nom..."
                 [ngModel]="filterTerm()"
                 (ngModelChange)="filterTerm.set($event)" />
        </div>
        <a routerLink="/recipes/new" class="btn btn-primary mb-2">Ajouter une recette</a>
      </div>

      <div *ngIf="filteredRecipes().length === 0" class="alert alert-info">
        Aucune recette trouvée.
      </div>

      <div class="row">
        <div class="col-md-4 mb-4" *ngFor="let recipe of filteredRecipes()">
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
  filterTerm = signal<string>('');
  totalCount = signal<number>(0);
  filteredRecipes = computed(() => {
    const term = this.filterTerm().trim().toLowerCase();
    if (!term) {
      return this.recipes();
    }
    return this.recipes().filter(recipe => recipe.name.toLowerCase().includes(term));
  });

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getRecipesPage(0, 10000).subscribe({ //TODO: implement pagination
      next: (response) => {
        const body = response.body || [];
        const total = Number(response.headers.get('X-Total-Count') || 0);
        console.log(`Loaded recipes: ${body.length} recipes, total count: ${total} | ${response.headers.keys()}`);
        this.recipes.set(body);
        this.totalCount.set(total);
      },
      error: (err) => {
        console.error('Error loading recipes:', err);
      }
    });
  }
}
