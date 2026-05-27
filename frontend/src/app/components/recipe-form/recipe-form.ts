import { Component, OnInit, ElementRef, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
              <div class="input-group">
                <input
                  #ingredientInput
                  type="text"
                  class="form-control ingredient-autocomplete"
                  [value]="getIngredientText(i)"
                  (input)="onIngredientInputText(i, $event.target.value)"
                  (blur)="applyIngredientFromName(i)"
                  (keydown.enter)="applyIngredientFromName(i)"
                  [attr.list]="getIngredientDatalistId(i)"
                  placeholder="Sélectionner un ingrédient"
                />
                <datalist [id]="getIngredientDatalistId(i)">
                  <option *ngFor="let item of allIngredients" [value]="item.name"></option>
                </datalist>
              </div>
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
          <div class="btn-group mb-2" role="group" aria-label="Markdown formatting">
            <button type="button" class="btn btn-outline-secondary" (click)="formatBold()">Gras</button>
            <button type="button" class="btn btn-outline-secondary" (click)="formatItalic()">Italique</button>
            <button type="button" class="btn btn-outline-secondary" (click)="formatHeading()">Titre</button>
            <button type="button" class="btn btn-outline-secondary" (click)="formatList()">Liste</button>
            <button type="button" class="btn btn-outline-secondary" (click)="formatCode()">Code</button>
            <button type="button" class="btn btn-outline-secondary" (click)="formatQuote()">Citation</button>
          </div>
          <textarea #instructionsTextarea id="instructions" formControlName="instructions" class="form-control" rows="10"
                    (input)="onInstructionsChange()"></textarea>
        </div>

        <div class="card card-body markdown-preview mb-3">
          <h5>Prévisualisation</h5>
          <div [innerHTML]="markdownPreview()"></div>
        </div>

        <button type="submit" class="btn btn-primary" [disabled]="!recipeForm.valid">Enregistrer</button>
        <a routerLink="/recipes" class="btn btn-secondary ml-2">Annuler</a>
      </form>
    </div>
  `,
  styles: [`
    .container { margin-top: 20px; margin-bottom: 50px; }
    .ml-2 { margin-left: 10px; }
    .ingredient-autocomplete { font-size: 0.95rem; }
    .input-group button { min-width: 40px; }
    .input-group button .material-icons { vertical-align: middle; }
  `]
})
export class RecipeFormComponent implements OnInit {
  @ViewChild('instructionsTextarea') instructionsTextarea!: ElementRef<HTMLTextAreaElement>;

  recipeForm: FormGroup;
  isEdit = false;
  recipeId?: number;
  allIngredients: Ingredient[] = [];
  allRecipes: Recipe[] = [];
  showNewIngredientForm = false;
  ingredientInputValues: Record<number, string> = {};
  markdownPreview = signal<SafeHtml>(null as unknown as SafeHtml);

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer
  ) {
    this.markdownPreview.set(this.sanitizer.bypassSecurityTrustHtml(''));
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
    this.recipeId = Number(this.route.snapshot.paramMap.get('id'));
    
    // Load ingredients and recipes data
    this.apiService.getIngredients().subscribe(data => {
      this.allIngredients = data;
      
      this.apiService.getRecipes().subscribe(recipes => {
        this.allRecipes = recipes.filter(r => r.id !== this.recipeId);
        
        // If editing, load the recipe after data is ready
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
            
            // Add ingredients to form array
            recipe.ingredients.forEach((ri, index) => {
              this.ingredients.push(this.fb.group({
                ingredient_id: [ri.ingredient_id, Validators.required],
                quantity: [ri.quantity, Validators.required]
              }));
              // Cache ingredient name from response or lookup by ID
              const ingredientName = ri.ingredient?.name || this.getIngredientNameById(ri.ingredient_id);
              if (ingredientName) {
                this.ingredientInputValues[index] = ingredientName;
              }
            });
            
            this.updatePreview(recipe.instructions);
          });
        }
      });
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
    delete this.ingredientInputValues[index];
  }

  getIngredientDatalistId(index: number): string {
    return `ingredient-options-${index}`;
  }

  getIngredientNameById(id: number | null): string | null {
    return this.allIngredients.find(ing => ing.id === id)?.name ?? null;
  }

  getIngredientText(index: number): string {
    if (this.ingredientInputValues[index] !== undefined) {
      return this.ingredientInputValues[index];
    }
    const control = this.ingredients.at(index);
    const ingredientId = control?.get('ingredient_id')?.value;
    return ingredientId ? this.getIngredientNameById(ingredientId) ?? '' : '';
  }

  onIngredientInputText(index: number, value: string) {
    this.ingredientInputValues[index] = value;
  }

  applyIngredientFromName(index: number) {
    const name = this.ingredientInputValues[index]?.trim();
    const ingredient = this.allIngredients.find(ing => ing.name === name);
    const ingredientId = ingredient ? ingredient.id : null;
    const control = this.ingredients.at(index);
    control?.get('ingredient_id')?.setValue(ingredientId);
    if (!ingredientId) {
      delete this.ingredientInputValues[index];
    }
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

  onInstructionsChange() {
    this.updatePreview(this.recipeForm.value.instructions || '');
  }

  formatBold() {
    this.applyMarkdown('**', '**', 'texte en gras');
  }

  formatItalic() {
    this.applyMarkdown('*', '*', 'texte en italique');
  }

  formatHeading() {
    this.applyMarkdown('# ', '', 'Titre');
  }

  formatList() {
    this.applyMarkdown('- ', '', 'Élément de liste');
  }

  formatCode() {
    this.applyMarkdown('`', '`', 'code');
  }

  formatQuote() {
    this.applyMarkdown('> ', '', 'citation');
  }

  private applyMarkdown(prefix: string, suffix: string, placeholder: string) {
    const textarea = this.instructionsTextarea?.nativeElement;
    if (!textarea) {
      return;
    }

    const value = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || placeholder;
    const newText = `${prefix}${selectedText}${suffix}`;
    const updated = value.slice(0, start) + newText + value.slice(end);

    this.recipeForm.patchValue({ instructions: updated });
    this.updatePreview(updated);

    const cursorPosition = start + newText.length;
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    });
  }

  private updatePreview(markdown: string) {
    const html = this.markdownToHtml(markdown);
    this.markdownPreview.set(this.sanitizer.bypassSecurityTrustHtml(html));
  }

  private markdownToHtml(text: string): string {
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    html = html.replace(/```\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    html = html.replace(/^###### (.*)$/gm, '<h6>$1</h6>');
    html = html.replace(/^##### (.*)$/gm, '<h5>$1</h5>');
    html = html.replace(/^#### (.*)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');
    html = html.replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');

    html = html.replace(/^\s*[-*+] (.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    html = html.replace(/^\s*\d+\. (.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gs, '<ol>$1</ol>');

    html = html.split(/\n{2,}/).map(paragraph => {
      if (paragraph.match(/^<h[1-6]>|^<ul>|^<ol>|^<pre>|^<blockquote>/)) {
        return paragraph;
      }
      return `<p>${paragraph.replace(/\n/g, '<br/>')}</p>`;
    }).join('');

    return html;
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
