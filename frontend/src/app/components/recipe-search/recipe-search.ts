import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
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

      <nav *ngIf="totalCount() > pageSize" aria-label="Pagination recette">
        <ul class="pagination justify-content-center mt-3">
          <li class="page-item" [class.disabled]="currentPage() === 1">
            <button class="page-link" (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 1">Précédent</button>
          </li>
          <li class="page-item" *ngFor="let page of pages()" [class.active]="page === currentPage()">
            <button class="page-link" (click)="goToPage(page)">{{ page }}</button>
          </li>
          <li class="page-item" [class.disabled]="currentPage() === pageCount()">
            <button class="page-link" (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() === pageCount()">Suivant</button>
          </li>
        </ul>
      </nav>

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
  totalCount = signal<number>(0);
  hasSearched = signal<boolean>(false);
  allIngredients = signal<Ingredient[]>([]);
  currentPage = signal<number>(1);
  readonly pageSize = 10;

  pageCount = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize)));
  pages = computed(() => Array.from({ length: this.pageCount() }, (_, i) => i + 1));

  constructor(private route: ActivatedRoute, private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.apiService.getIngredients().subscribe(data => {
      this.allIngredients.set(data);
    });
    this.route.params.subscribe(params => {
      const name = params['name'];
      if (name) {
        this.searchTerm.set(name);
        this.loadPage(1);
      }
    });
  }

  search() {
    this.router.navigate(['/search', this.searchTerm().trim()]);
  }

  loadPage(page: number) {
    const term = this.searchTerm().trim();
    if (!term) {
      return;
    }

    this.apiService.searchRecipesByIngredient(term, page, this.pageSize).subscribe(response => {
      this.results.set(response.body ?? []);
      this.totalCount.set(Number(response.headers.get('X-Total-Count') ?? '0'));
      this.currentPage.set(page);
      this.hasSearched.set(true);
    });
  }

  goToPage(page: number) {
    const newPage = Math.min(Math.max(page, 1), this.pageCount());
    if (newPage !== this.currentPage()) {
      this.loadPage(newPage);
    }
  }
}
