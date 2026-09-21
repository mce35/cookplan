import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../services/api.service';
import { Ingredient } from '../../models/models';
import { ConfirmDialogComponent } from './confirm-dialog';

@Component({
  selector: 'app-ingredient-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="container">
      <h2>Gestion des ingrédients</h2>

      <div class="card mb-3 p-3">
        <h5>Ajouter un ingrédient</h5>
        <div class="row align-items-center">
          <div class="col-md-5 mb-2">
            <input [(ngModel)]="newName" class="form-control" placeholder="Nom">
          </div>
          <div class="col-md-3 mb-2">
            <input [(ngModel)]="newUnit" class="form-control" placeholder="Unité">
          </div>
          <div class="col-md-2 mb-2">
            <button class="btn btn-success" (click)="add()">Ajouter</button>
          </div>
        </div>
      </div>

      <div class="card p-3">
        <h5>Ingrédients existants</h5>
        <input [(ngModel)]="searchTerm" class="form-control mb-3" placeholder="Rechercher un ingrédient">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Unité</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let ing of filteredIngredients">
              <td *ngIf="editIndex !== ing">{{ ing.name }}</td>
              <td *ngIf="editIndex === ing"><input [(ngModel)]="editName" class="form-control"></td>

              <td *ngIf="editIndex !== ing">{{ ing.unit }}</td>
              <td *ngIf="editIndex === ing"><input [(ngModel)]="editUnit" class="form-control"></td>

              <td>
                <div class="btn-group btn-group-sm" role="group" aria-label="Stock">
                  <button class="btn btn-outline-primary" (click)="changeStock(ing, -1)" [disabled]="(ing.stock ?? 0) === 0">-</button>
                  <input type="number" min="0" class="stock-input" [(ngModel)]="ing.stock" (change)="updateStock(ing)" aria-label="Stock en cours">
                  <button class="btn btn-outline-primary" (click)="changeStock(ing, 1)">+</button>
                </div>
              </td>

              <td>
                <div *ngIf="editIndex !== ing">
                  <button class="btn btn-sm btn-outline-primary mr-2" (click)="startEdit(ing)">Éditer</button>
                  <button class="btn btn-sm btn-outline-danger mr-2" (click)="remove(ing.id, ing.name)">Supprimer</button>
                  <button class="btn btn-sm btn-outline-info" (click)="viewRecipes(ing.name)">Recettes</button>
                </div>
                <div *ngIf="editIndex === ing">
                  <button class="btn btn-sm btn-primary mr-2" (click)="saveEdit(ing.id)">Enregistrer</button>
                  <button class="btn btn-sm btn-secondary" (click)="cancelEdit()">Annuler</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .stock-input {
      width: 4rem;
      padding: 0.25rem 0.5rem;
      text-align: center;
      border: 1px solid #0d6efd;
      border-radius: 0;
      appearance: textfield;
      -moz-appearance: textfield;
    }

    .stock-input::-webkit-inner-spin-button,
    .stock-input::-webkit-outer-spin-button {
      margin: 0;
      -webkit-appearance: none;
    }
  `]
})
export class IngredientManagerComponent implements OnInit {
  ingredients: Ingredient[] = [];
  newName = '';
  newUnit = '';
  searchTerm = '';

  editIndex: Ingredient | null = null;
  editName = '';
  editUnit = '';

  constructor(private api: ApiService, private router: Router, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.reload();
  }

  get filteredIngredients(): Ingredient[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.ingredients;
    return this.ingredients.filter(ingredient =>
      (ingredient.name || '').toLowerCase().includes(term)
    );
  }

  reload() {
    this.api.getIngredients().subscribe(data => this.ingredients = data || []);
  }

  add() {
    const name = (this.newName || '').trim();
    const unit = (this.newUnit || '').trim();
    if (!name) return;
    const payload: Ingredient = { id: 0, name, unit } as Ingredient;
    this.api.createIngredient(payload).subscribe(() => {
      this.newName = '';
      this.newUnit = '';
      this.reload();
    });
  }

  startEdit(ingredient: Ingredient) {
    this.editIndex = ingredient;
    this.editName = ingredient.name || '';
    this.editUnit = ingredient.unit || '';
  }

  cancelEdit() {
    this.editIndex = null;
    this.editName = '';
    this.editUnit = '';
  }

  saveEdit(id: number | undefined) {
    if (!id) return;
    const ingredient = this.ingredients.find(item => item.id === id);
    const payload: Ingredient = {
      id,
      name: this.editName.trim(),
      unit: this.editUnit.trim(),
      stock: ingredient?.stock ?? 0
    };
    this.api.updateIngredient(id, payload).subscribe(() => {
      this.cancelEdit();
      this.reload();
    });
  }

  changeStock(ingredient: Ingredient, delta: number) {
    if (!ingredient.id) return;
    const request = delta > 0
      ? this.api.increaseIngredientStock(ingredient.id, delta)
      : this.api.decreaseIngredientStock(ingredient.id, Math.abs(delta));
    request.subscribe(updated => {
      ingredient.stock = updated.stock;
    });
  }

  updateStock(ingredient: Ingredient) {
    if (!ingredient.id) return;
    const stock = Math.max(0, Number(ingredient.stock) || 0);
    ingredient.stock = stock;
    const payload: Ingredient = { ...ingredient, stock };
    this.api.updateIngredient(ingredient.id, payload).subscribe(updated => {
      ingredient.stock = updated.stock;
    });
  }

  remove(id: number | undefined, name: string | undefined = '') {
    if (!id) return;
    if (!name) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '360px',
      data: { message: `Supprimer l'ingrédient "${name}" ?` }
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.api.deleteIngredient(id).subscribe(() => this.reload());
      }
    });
  }

  viewRecipes(name: string | undefined) {
    if (!name) return;
    this.router.navigate(['/search', name]);
  }
}
