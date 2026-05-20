import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Recipe, Ingredient } from '../../models/models';

@Component({
  selector: 'app-recipe-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="container">
      <h2>{{ isEdit ? 'Modifier' : 'Ajouter' }} une recette</h2>
      <form [formGroup]="recipeForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="name">Nom</label>
          <input type="text" id="name" formControlName="name" class="form-control">
        </div>

        <div class="row">
          <div class="form-group col-md-3">
            <label for="servings">Personnes</label>
            <input type="number" id="servings" formControlName="servings" class="form-control">
          </div>
          <div class="form-group col-md-3">
            <label for="prep_time">Prép (min)</label>
            <input type="number" id="prep_time" formControlName="prep_time" class="form-control">
          </div>
          <div class="form-group col-md-3">
            <label for="cook_time">Cuisson (min)</label>
            <input type="number" id="cook_time" formControlName="cook_time" class="form-control">
          </div>
          <div class="form-group col-md-3">
            <label for="recipe_type">Type</label>
            <select id="recipe_type" formControlName="recipe_type" class="form-control">
              <option value="entree">Entrée</option>
              <option value="plat">Plat</option>
              <option value="accompagnement">Accompagnement</option>
              <option value="dessert">Dessert</option>
            </select>
          </div>
        </div>

        <h4>Ingrédients</h4>
        <div formArrayName="ingredients">
          <div *ngFor="let ing of ingredients.controls; let i=index" [formGroupName]="i" class="row mb-2">
            <div class="col-md-5">
              <select formControlName="ingredient_id" class="form-control">
                <option *ngFor="let item of allIngredients" [value]="item.id">{{ item.name }} ({{ item.unit }})</option>
              </select>
            </div>
            <div class="col-md-3">
              <input type="number" formControlName="quantity" class="form-control" placeholder="Quantité">
            </div>
            <div class="col-md-2">
              <button type="button" (click)="removeIngredient(i)" class="btn btn-danger">X</button>
            </div>
          </div>
        </div>
        <button type="button" (click)="addIngredient()" class="btn btn-secondary mb-3">Ajouter un ingrédient</button>
        <button type="button" (click)="showNewIngredientForm = !showNewIngredientForm" class="btn btn-info mb-3 ml-2">Nouvel ingrédient type</button>

        <div *ngIf="showNewIngredientForm" class="card mb-3 p-3">
          <h5>Créer un nouvel ingrédient type</h5>
          <div class="row">
            <div class="col-md-5">
              <input #newIngName type="text" class="form-control" placeholder="Nom">
            </div>
            <div class="col-md-3">
              <input #newIngUnit type="text" class="form-control" placeholder="Unité (g, ml, unité...)">
            </div>
            <div class="col-md-2">
              <button type="button" (click)="createNewIngredient(newIngName.value, newIngUnit.value)" class="btn btn-success">OK</button>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="dependency_ids">Dépendances (Préparations de base)</label>
          <select multiple id="dependency_ids" class="form-control" formControlName="dependency_ids">
            <option *ngFor="let r of allRecipes" [value]="r.id">{{ r.name }}</option>
          </select>
        </div>

        <div class="form-group">
          <label for="instructions">Instructions / Étapes</label>
          <textarea id="instructions" formControlName="instructions" class="form-control" rows="10"></textarea>
        </div>

        <button type="submit" class="btn btn-primary" [disabled]="!recipeForm.valid">Enregistrer</button>
        <a routerLink="/recipes" class="btn btn-secondary ml-2">Annuler</a>
      </form>
    </div>
  `,
  styles: [`
    .container { margin-top: 20px; margin-bottom: 50px; }
    .ml-2 { margin-left: 10px; }
  `]
})
export class RecipeFormComponent implements OnInit {
  recipeForm: FormGroup;
  isEdit = false;
  recipeId?: number;
  allIngredients: Ingredient[] = [];
  allRecipes: Recipe[] = [];
  showNewIngredientForm = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.recipeForm = this.fb.group({
      name: ['', Validators.required],
      servings: [4, Validators.required],
      prep_time: [15, Validators.required],
      cook_time: [15, Validators.required],
      recipe_type: ['plat', Validators.required],
      instructions: ['', Validators.required],
      ingredients: this.fb.array([]),
      dependency_ids: [[]]
    });
  }

  get ingredients() {
    return this.recipeForm.get('ingredients') as FormArray;
  }

  ngOnInit(): void {
    this.loadData();
    this.recipeId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.recipeId) {
      this.isEdit = true;
      this.apiService.getRecipe(this.recipeId).subscribe(recipe => {
        this.recipeForm.patchValue({
          name: recipe.name,
          servings: recipe.servings,
          prep_time: recipe.prep_time,
          cook_time: recipe.cook_time,
          recipe_type: recipe.recipe_type,
          instructions: recipe.instructions,
          dependency_ids: recipe.dependencies?.map(d => d.id) || []
        });
        recipe.ingredients.forEach(ri => {
          this.ingredients.push(this.fb.group({
            ingredient_id: [ri.ingredient_id, Validators.required],
            quantity: [ri.quantity, Validators.required]
          }));
        });
      });
    }
  }

  loadData() {
    this.apiService.getIngredients().subscribe(data => this.allIngredients = data);
    this.apiService.getRecipes().subscribe(data => {
        // filter out current recipe to avoid self-dependency
        this.allRecipes = data.filter(r => r.id !== this.recipeId);
    });
  }

  addIngredient() {
    this.ingredients.push(this.fb.group({
      ingredient_id: [null, Validators.required],
      quantity: [null, Validators.required]
    }));
  }

  removeIngredient(index: number) {
    this.ingredients.removeAt(index);
  }

  createNewIngredient(name: string, unit: string) {
    if (name && unit) {
      this.apiService.createIngredient({ name, unit }).subscribe(newIng => {
        this.allIngredients.push(newIng);
        this.showNewIngredientForm = false;
        alert(`Ingrédient ${newIng.name} créé !`);
      });
    }
  }

  onSubmit() {
    if (this.recipeForm.valid) {
      const recipeData = this.recipeForm.value;
      if (this.isEdit && this.recipeId) {
        this.apiService.updateRecipe(this.recipeId, recipeData).subscribe(() => {
          this.router.navigate(['/recipes', this.recipeId]);
        });
      } else {
        this.apiService.createRecipe(recipeData).subscribe(newRecipe => {
          this.router.navigate(['/recipes', newRecipe.id]);
        });
      }
    }
  }
}
