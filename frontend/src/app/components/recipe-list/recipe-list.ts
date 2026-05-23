import { Component, OnInit, computed, signal } from '@angular/core';
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
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap">
        <div>
          <h2>Liste des Recettes ({{ totalCount() }})</h2>
          <small class="text-muted">Page {{ currentPage() }} / {{ totalPages() }}</small>
        </div>
        <div class="btn-group mb-2">
          <button class="btn btn-sm btn-outline-secondary" [disabled]="currentPage() === 1" (click)="changePage(currentPage() - 1)">Précédent</button>
          <button class="btn btn-sm btn-outline-secondary" [disabled]="currentPage() >= totalPages()" (click)="changePage(currentPage() + 1)">Suivant</button>
        </div>
        <a routerLink="/recipes/new" class="btn btn-primary mb-2">Ajouter une recette</a>
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
  currentPage = signal<number>(1);
  pageSize = 20;
  totalCount = signal<number>(0);
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize)));

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadPage(1);
  }

  loadPage(page: number) {
    this.apiService.getRecipesPage(page, this.pageSize).subscribe({
      next: (response) => {
        const body = response.body || [];
        const total = Number(response.headers.get('X-Total-Count') || 0);
        console.log(`Loaded page ${page}: ${body.length} recipes, total count: ${total} | ${response.headers.keys()}`);
        this.recipes.set(body);
        this.totalCount.set(total);
        this.currentPage.set(page);
      },
      error: (err) => {
        console.error('Error loading recipes:', err);
      }
    });
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages()) {
      return;
    }
    this.loadPage(page);
  }
}
