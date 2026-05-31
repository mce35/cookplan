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
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Unité</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let ing of ingredients; let i = index">
              <td *ngIf="editIndex !== i">{{ ing.name }}</td>
              <td *ngIf="editIndex === i"><input [(ngModel)]="editName" class="form-control"></td>

              <td *ngIf="editIndex !== i">{{ ing.unit }}</td>
              <td *ngIf="editIndex === i"><input [(ngModel)]="editUnit" class="form-control"></td>

              <td>
                <div *ngIf="editIndex !== i">
                  <button class="btn btn-sm btn-outline-primary mr-2" (click)="startEdit(i)">Éditer</button>
                  <button class="btn btn-sm btn-outline-danger mr-2" (click)="remove(ing.id, ing.name)">Supprimer</button>
                  <button class="btn btn-sm btn-outline-info" (click)="viewRecipes(ing.name)">Recettes</button>
                </div>
                <div *ngIf="editIndex === i">
                  <button class="btn btn-sm btn-primary mr-2" (click)="saveEdit(ing.id)">Enregistrer</button>
                  <button class="btn btn-sm btn-secondary" (click)="cancelEdit()">Annuler</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class IngredientManagerComponent implements OnInit {
  ingredients: Ingredient[] = [];
  newName = '';
  newUnit = '';

  editIndex: number | null = null;
  editName = '';
  editUnit = '';

  constructor(private api: ApiService, private router: Router, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.reload();
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

  startEdit(index: number) {
    this.editIndex = index;
    this.editName = this.ingredients[index].name || '';
    this.editUnit = this.ingredients[index].unit || '';
  }

  cancelEdit() {
    this.editIndex = null;
    this.editName = '';
    this.editUnit = '';
  }

  saveEdit(id: number | undefined) {
    if (!id) return;
    const payload: Ingredient = { id, name: this.editName.trim(), unit: this.editUnit.trim() } as Ingredient;
    this.api.updateIngredient(id, payload).subscribe(() => {
      this.cancelEdit();
      this.reload();
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
