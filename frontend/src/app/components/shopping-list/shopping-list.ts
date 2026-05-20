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
        <div class="col-md-4">
          <label>Du</label>
          <input type="date" [(ngModel)]="startDate" class="form-control">
        </div>
        <div class="col-md-4">
          <label>Au</label>
          <input type="date" [(ngModel)]="endDate" class="form-control">
        </div>
        <div class="col-md-4 d-flex align-items-end">
          <button (click)="generateList()" class="btn btn-primary">Générer</button>
        </div>
      </div>

      <div *ngIf="items.length > 0" class="card shadow-sm">
        <div class="card-header bg-success text-white">
            <strong>{{ items.length }} ingrédients nécessaires</strong>
        </div>
        <ul class="list-group list-group-flush">
          <li *ngFor="let item of items" class="list-group-item d-flex justify-content-between">
            <span>{{ item.name }}</span>
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
  `]
})
export class ShoppingListComponent implements OnInit {
  startDate: string = '';
  endDate: string = '';
  items: ShoppingItem[] = [];
  hasGenerated = false;

  constructor(private apiService: ApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['start'] && params['end']) {
        this.startDate = params['start'];
        this.endDate = params['end'];
        this.generateList();
      } else {
        const now = new Date();
        this.startDate = now.toISOString().split('T')[0];
        const later = new Date();
        later.setDate(now.getDate() + 7);
        this.endDate = later.toISOString().split('T')[0];
      }
    });
  }

  generateList() {
    if (!this.startDate || !this.endDate) return;
    this.apiService.getShoppingList(this.startDate, this.endDate).subscribe(data => {
      this.items = data;
      this.hasGenerated = true;
    });
  }
}
