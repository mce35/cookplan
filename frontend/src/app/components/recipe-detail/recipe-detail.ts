import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Recipe } from '../../models/models';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mt-4" *ngIf="recipe">
      <div class="card shadow">
        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h2 class="mb-0">{{ recipe.name }}</h2>
          <div>
            <a [routerLink]="['/recipes', recipe.id, 'edit']" class="btn btn-warning btn-sm mr-2">Modifier</a>
            <button (click)="deleteRecipe()" class="btn btn-danger btn-sm">Supprimer</button>
          </div>
        </div>
        <div class="card-body">
          <div class="row mb-4">
            <div class="col-md-3"><strong>Type:</strong> {{ recipe.recipe_type }}</div>
            <div class="col-md-3"><strong>Personnes:</strong> {{ recipe.servings }}</div>
            <div class="col-md-3"><strong>Prép:</strong> {{ recipe.prep_time }} min</div>
            <div class="col-md-3"><strong>Cuisson:</strong> {{ recipe.cook_time }} min</div>
          </div>

          <hr>

          <h4>Ingrédients</h4>
          <ul class="list-group list-group-flush mb-4">
            <li *ngFor="let ri of recipe.ingredients" class="list-group-item">
              {{ ri.quantity }} {{ ri.ingredient?.unit }} {{ ri.ingredient?.name }}
            </li>
          </ul>

          <div *ngIf="recipe.dependencies && recipe.dependencies.length > 0" class="mb-4">
            <h4>Dépendances</h4>
            <div class="list-group">
              <a *ngFor="let dep of recipe.dependencies" [routerLink]="['/recipes', dep.id]" class="list-group-item list-group-item-action py-1">
                {{ dep.name }}
              </a>
            </div>
          </div>

          <h4>Instructions</h4>
          <div class="bg-light p-3 rounded" style="white-space: pre-line;">
            {{ recipe.instructions }}
          </div>
        </div>
      </div>
      <a routerLink="/recipes" class="btn btn-link mt-3 p-0">← Retour à la liste</a>
    </div>
  `,
  styles: [`
    .container { margin-bottom: 50px; }
  `]
})
export class RecipeDetailComponent implements OnInit {
  recipe?: Recipe;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = Number(params['id']);
      if (id) {
        this.apiService.getRecipe(id).subscribe({
            next: data => this.recipe = data,
            error: err => console.error('Error fetching recipe', err)
        });
      }
    });
  }

  deleteRecipe(): void {
    if (this.recipe && this.recipe.id && confirm('Voulez-vous vraiment supprimer cette recette ?')) {
      this.apiService.deleteRecipe(this.recipe.id).subscribe(() => {
        this.router.navigate(['/recipes']);
      });
    }
  }
}
