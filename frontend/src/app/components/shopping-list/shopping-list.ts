import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ShoppingItem } from '../../models/models';

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h2>Liste de courses</h2>
      <div class="row mb-3">
        <div class="col-md-3">
          <label>Du</label>
          <input type="date" [(ngModel)]="startDate" class="form-control">
        </div>
        <div class="col-md-3">
          <label>Au</label>
          <input type="date" [(ngModel)]="endDate" class="form-control">
        </div>
        <div class="col-md-3">
          <label>Personnes</label>
          <input type="number" min="1" [(ngModel)]="persons" class="form-control">
        </div>
        <div class="col-md-3 d-flex align-items-end">
          <button (click)="generateList()" class="btn btn-primary">Générer</button>
        </div>
      </div>

      <div *ngIf="items.length > 0" class="card shadow-sm">
        <div class="card-header bg-success text-white">
            <strong>{{ items.length }} ingrédients nécessaires</strong>
        </div>
        <ul class="list-group list-group-flush">
          <li *ngFor="let item of items" class="list-group-item d-flex justify-content-between">
            <span>{{ item.name }} <span class="recipes-names">({{ item.recipe_names }})</span></span>
            <span><strong>{{ item.quantity }} {{ item.unit }}</strong></span>
          </li>
        </ul>
      </div>
      <div *ngIf="items.length === 0 && hasGenerated" class="alert alert-info">
        Aucun ingrédient pour cette période.
      </div>
    </div>
  `,
  styles: [`
    .container { margin-top: 20px; }
    .recipes-names { font-weight: bold; font-size: 0.75rem; color: #666; margin-bottom: 2px; }
  `]
})
export class ShoppingListComponent implements OnInit {
  startDate: string = '';
  endDate: string = '';
  persons: number = 1;
  items: ShoppingItem[] = [];
  hasGenerated = false;

  constructor(private apiService: ApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['start'] && params['end']) {
        this.startDate = params['start'];
        this.endDate = params['end'];
        this.persons = params['persons'] ? Number(params['persons']) || 1 : 1;
        this.generateList();
      } else {
        const now = new Date();
        this.startDate = this.formatLocalDate(now);
        const later = new Date();
        later.setDate(now.getDate() + 7);
        this.endDate = this.formatLocalDate(later);
      }
    });
  }

  formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  generateList() {
    if (!this.startDate || !this.endDate) return;
    const persons = Number(this.persons) || 1;
    this.apiService.getShoppingList(this.startDate, this.endDate, persons).subscribe(data => {
      this.items = data;
      this.hasGenerated = true;
    });
  }
}
