import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Recipe } from '../../models/models';
import { MarkdownPipe } from '../../pipes/markdown.pipe';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MarkdownPipe],
  template: `
    <div class="container mt-4" *ngIf="recipe()">
      <div class="card shadow">
        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <div class="recipe-heading">
            <h2 class="mb-0">{{ recipe()!.name }}</h2>
            <span class="badge recipe-type" [ngClass]="recipeTypeClass(recipe()!.recipe_type)">{{ recipe()!.recipe_type }}</span>
          </div>
          <div class="recipe-actions">
            <a [routerLink]="['/recipes', recipe()!.id, 'edit']" class="icon-action edit-action"
               [attr.aria-label]="'Modifier ' + recipe()!.name" title="Modifier">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
              </svg>
            </a>
            <button type="button" (click)="deleteRecipe()" class="icon-action delete-action"
                    [attr.aria-label]="'Supprimer ' + recipe()!.name" title="Supprimer">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="m19 6-1 14H6L5 6" />
                <path d="M10 11v5M14 11v5" />
              </svg>
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class="row mb-4">
            <div class="col-md-4"><strong>Personnes:</strong> {{ recipe()!.servings }}</div>
            <div class="col-md-4"><strong>Prép:</strong> {{ recipe()!.prep_time }} min</div>
            <div class="col-md-4"><strong>Cuisson:</strong> {{ recipe()!.cook_time }} min</div>
          </div>

          <hr>

          <h4>Ingrédients</h4>
          <ul class="list-group list-group-flush mb-4">
            <li *ngFor="let ri of recipe()!.ingredients" class="list-group-item">
              {{ ri.quantity }} {{ ri.ingredient?.unit }} {{ ri.ingredient?.name }}
            </li>
          </ul>

          <div *ngIf="recipe()!.dependencies && recipe()!.dependencies!.length > 0" class="mb-4">
            <h4>Dépendances</h4>
            <div class="list-group">
              <a *ngFor="let dep of recipe()!.dependencies" [routerLink]="['/recipes', dep.id]" class="list-group-item list-group-item-action py-1">
                {{ dep.name }}
              </a>
            </div>
          </div>

          <h4>Instructions</h4>
          <div class="bg-light p-3 rounded recipe-instructions">
            <div [innerHTML]="recipe()!.instructions | markdown"></div>
          </div>
        </div>
      </div>
      <a routerLink="/recipes" class="btn btn-link mt-3 p-0">← Retour à la liste</a>
    </div>
  `,
  styles: [`
    .container { margin-bottom: 50px; }
    .recipe-heading { display: flex; align-items: center; flex-wrap: wrap; gap: .6rem; min-width: 0; }
    .recipe-heading h2 { overflow-wrap: anywhere; }
    .recipe-type.type-plat { color: #084298; background-color: #cfe2ff; }
    .recipe-type.type-dessert { color: #842029; background-color: #f8d7da; }
    .recipe-type.type-accompagnement { color: #0f5132; background-color: #d1e7dd; }
    .recipe-actions { display: flex; gap: .45rem; margin-left: 1rem; }
    .icon-action { display: inline-flex; align-items: center; justify-content: center; width: 2rem; height: 2rem; padding: .35rem; border: 1px solid currentColor; border-radius: .25rem; background: transparent; }
    .icon-action svg { width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
    .edit-action { color: #fff; background-color: #ffc107; border-color: #ffc107; }
    .edit-action:hover, .edit-action:focus-visible { color: #fff; background-color: #e0a800; border-color: #d39e00; }
    .delete-action { color: #fff; background-color: #dc3545; border-color: #dc3545; }
    .delete-action:hover, .delete-action:focus-visible { color: #fff; background-color: #c82333; border-color: #bd2130; }
    @media (max-width: 576px) {
      .card-header { align-items: flex-start !important; }
      .recipe-actions { margin-left: .5rem; }
    }
  `]
})
export class RecipeDetailComponent implements OnInit {
  recipe = signal<Recipe | undefined>(undefined);

  recipeTypeClass(type: string): string {
    switch (type) {
      case 'plat': return 'type-plat';
      case 'dessert': return 'type-dessert';
      case 'accompagnement': return 'type-accompagnement';
      default: return 'type-default';
    }
  }

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
            next: data => this.recipe.set(data),
            error: err => console.error('Error fetching recipe', err)
        });
      }
    });
  }

  deleteRecipe(): void {
    const recipe = this.recipe();
    if (recipe?.id && confirm('Voulez-vous vraiment supprimer cette recette ?')) {
      this.apiService.deleteRecipe(recipe.id).subscribe(() => {
        this.router.navigate(['/recipes']);
      });
    }
  }
}
