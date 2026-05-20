import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { RecipeShort } from '../../models/models';

@Component({
  selector: 'app-recipe-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container">
      <h2>Rechercher des recettes par ingrédient</h2>
      <div class="input-group mb-3">
        <input type="text" [(ngModel)]="searchTerm" (keyup.enter)="search()" class="form-control" placeholder="Nom de l'ingrédient...">
        <div class="input-group-append">
          <button (click)="search()" class="btn btn-primary">Rechercher</button>
        </div>
      </div>

      <div *ngIf="results.length > 0" class="list-group">
        <a *ngFor="let recipe of results" [routerLink]="['/recipes', recipe.id]" class="list-group-item list-group-item-action">
          {{ recipe.name }} <span class="badge badge-secondary float-right">{{ recipe.recipe_type }}</span>
        </a>
      </div>
      <div *ngIf="results.length === 0 && hasSearched" class="alert alert-info">
        Aucune recette trouvée pour cet ingrédient.
      </div>
    </div>
  `,
  styles: [`
    .container { margin-top: 20px; }
  `]
})
export class RecipeSearchComponent {
  searchTerm: string = '';
  results: RecipeShort[] = [];
  hasSearched = false;

  constructor(private apiService: ApiService) {}

  search() {
    if (this.searchTerm.trim()) {
      this.apiService.searchRecipesByIngredient(this.searchTerm).subscribe(data => {
        this.results = data;
        this.hasSearched = true;
      });
    }
  }
}
