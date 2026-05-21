import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { RecipeShort, Ingredient } from '../../models/models';

@Component({
  selector: 'app-recipe-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container">
      <h2>Rechercher des recettes par ingrédient</h2>
      <div class="input-group mb-3">
        <input type="text" [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)" (keyup.enter)="search()"
               class="form-control" placeholder="Nom de l'ingrédient..."
               list="ingredientOptions">
        <datalist id="ingredientOptions">
          <option *ngFor="let ing of allIngredients()" [value]="ing.name"></option>
        </datalist>
        <div class="input-group-append">
          <button (click)="search()" class="btn btn-primary">Rechercher</button>
        </div>
      </div>

      <div *ngIf="results().length > 0" class="list-group">
        <a *ngFor="let recipe of results()" [routerLink]="['/recipes', recipe.id]" class="list-group-item list-group-item-action">
          {{ recipe.name }} <span class="badge badge-secondary float-right">{{ recipe.recipe_type }}</span>
        </a>
      </div>
      <div *ngIf="results().length === 0 && hasSearched()" class="alert alert-info">
        Aucune recette trouvée pour cet ingrédient.
      </div>
    </div>
  `,
  styles: [`
    .container { margin-top: 20px; }
  `]
})
export class RecipeSearchComponent implements OnInit {
  searchTerm = signal<string>('');
  results = signal<RecipeShort[]>([]);
  hasSearched = signal<boolean>(false);
  allIngredients = signal<Ingredient[]>([]);

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getIngredients().subscribe(data => {
      this.allIngredients.set(data);
    });
  }

  search() {
    const term = this.searchTerm().trim();
    if (term) {
      this.apiService.searchRecipesByIngredient(term).subscribe(data => {
        this.results.set(data);
        this.hasSearched.set(true);
      });
    }
  }
}
