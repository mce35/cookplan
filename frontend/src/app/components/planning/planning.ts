import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Recipe, Planning } from '../../models/models';

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2>Planning</h2>
        <div class="d-flex align-items-center">
          <div class="btn-group mr-3">
            <button class="btn btn-outline-primary" [class.active]="viewMode === 'week'" (click)="setViewMode('week')">Semaine</button>
            <button class="btn btn-outline-primary" [class.active]="viewMode === 'month'" (click)="setViewMode('month')">Mois</button>
          </div>

          <div *ngIf="viewMode === 'week'" class="mr-3 d-flex align-items-center">
            <label for="numWeeks" class="mb-0 mr-2">Sms:</label>
            <input id="numWeeks" type="number" [(ngModel)]="numWeeks" (change)="updateRange()" class="form-control form-control-sm" style="width: 60px" min="1" max="8">
          </div>

          <button (click)="previous()" class="btn btn-outline-secondary mr-2">Précédent</button>
          <button (click)="next()" class="btn btn-outline-secondary mr-3">Suivant</button>

          <button (click)="toggleShoppingSelect()" class="btn" [class.btn-success]="!isSelectingShopping" [class.btn-danger]="isSelectingShopping">
            {{ isSelectingShopping ? 'Annuler Courses' : 'Générer Courses' }}
          </button>
        </div>
      </div>

      <div *ngIf="isSelectingShopping" class="alert alert-info py-2 mb-3">
        Cliquez sur une date de début puis une date de fin pour générer la liste de courses.
        <span *ngIf="shoppingStart" class="ml-2 font-weight-bold">Début: {{ shoppingStart | date:'shortDate' }}</span>
        <span *ngIf="shoppingEnd" class="ml-2 font-weight-bold">Fin: {{ shoppingEnd | date:'shortDate' }}</span>
      </div>

      <div class="planning-grid" [style.grid-template-columns]="gridColumns">
        <div *ngFor="let day of displayDays"
             class="day-card"
             [class.selecting]="isSelectingShopping"
             [class.selected-range]="isDateInRange(day)"
             (click)="selectDate(day)">
          <div class="day-header text-center" [class.bg-today]="isToday(day)">
            <strong>{{ day | date:'EEEE d MMM' : undefined : 'fr-FR' }}</strong>
          </div>

          <div class="meal-section">
            <div class="meal-label">Midi</div>
            <div class="recipe-select-group" (click)="$event.stopPropagation()">
                <select [(ngModel)]="getPlan(day, 'midi').main_recipe_id" (change)="savePlan(day, 'midi')" class="form-control form-control-sm mb-1">
                    <option [ngValue]="null">-- Plat --</option>
                    <option *ngFor="let r of recipesByType('plat')" [value]="r.id">{{ r.name }}</option>
                </select>
                <select [(ngModel)]="getPlan(day, 'midi').side_recipe_id" (change)="savePlan(day, 'midi')" class="form-control form-control-sm">
                    <option [ngValue]="null">-- Accomp. --</option>
                    <option *ngFor="let r of recipesByType('accompagnement')" [value]="r.id">{{ r.name }}</option>
                </select>
            </div>
          </div>

          <div class="meal-section">
            <div class="meal-label">Soir</div>
            <div class="recipe-select-group" (click)="$event.stopPropagation()">
                <select [(ngModel)]="getPlan(day, 'soir').main_recipe_id" (change)="savePlan(day, 'soir')" class="form-control form-control-sm mb-1">
                    <option [ngValue]="null">-- Plat --</option>
                    <option *ngFor="let r of recipesByType('plat')" [value]="r.id">{{ r.name }}</option>
                </select>
                <select [(ngModel)]="getPlan(day, 'soir').side_recipe_id" (change)="savePlan(day, 'soir')" class="form-control form-control-sm">
                    <option [ngValue]="null">-- Accomp. --</option>
                    <option *ngFor="let r of recipesByType('accompagnement')" [value]="r.id">{{ r.name }}</option>
                </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .planning-grid {
      display: grid;
      gap: 10px;
    }
    .day-card {
      border: 1px solid #c3e6cb;
      border-radius: 5px;
      padding: 5px;
      background-color: #f8fff9;
      min-width: 150px;
    }
    .day-card.selecting { cursor: pointer; }
    .day-card.selecting:hover { background-color: #e9ecef; }
    .day-card.selected-range { border: 2px solid #28a745; background-color: #d4edda; }

    .day-header {
      background-color: #e2f3e5;
      margin: -5px -5px 10px -5px;
      padding: 5px;
      border-bottom: 1px solid #c3e6cb;
      font-size: 0.85rem;
    }
    .bg-today { background-color: #ffc107 !important; border-bottom: 1px solid #ff9800; }
    .meal-section { margin-bottom: 10px; }
    .meal-label { font-weight: bold; font-size: 0.75rem; color: #666; margin-bottom: 2px; }
    .recipe-select-group select { font-size: 0.75rem; }
    .mr-2 { margin-right: 10px; }
    .mr-3 { margin-right: 15px; }
  `]
})
export class PlanningComponent implements OnInit {
  displayDays: Date[] = [];
  recipes: Recipe[] = [];
  planningData: Planning[] = [];

  viewMode: 'week' | 'month' = 'week';
  numWeeks: number = 1;
  referenceDate: Date = new Date();

  isSelectingShopping = false;
  shoppingStart: Date | null = null;
  shoppingEnd: Date | null = null;

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.updateRange();
    this.apiService.getRecipes().subscribe(data => this.recipes = data);
  }

  get gridColumns() {
    return `repeat(${this.viewMode === 'month' ? 7 : Math.min(this.displayDays.length, 7)}, 1fr)`;
  }

  setViewMode(mode: 'week' | 'month') {
    this.viewMode = mode;
    this.updateRange();
  }

  updateRange() {
    if (this.viewMode === 'week') {
      this.calculateWeeks();
    } else {
      this.calculateMonth();
    }
    this.loadPlanning();
  }

  calculateWeeks() {
    const start = new Date(this.referenceDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0,0,0,0);

    this.displayDays = [];
    const totalDays = this.numWeeks * 7;
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      this.displayDays.push(d);
    }
  }

  calculateMonth() {
    const start = new Date(this.referenceDate.getFullYear(), this.referenceDate.getMonth(), 1);
    // Adjust to Monday of the first week of the month
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    start.setHours(0,0,0,0);

    this.displayDays = [];
    // Always show 6 weeks for a consistent month view
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      this.displayDays.push(d);
    }
  }

  loadPlanning() {
    const start = this.formatDate(this.displayDays[0]);
    const end = this.formatDate(this.displayDays[this.displayDays.length - 1]);
    this.apiService.getPlanning(start, end).subscribe(data => {
      this.planningData = data;
    });
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getPlan(date: Date, mealType: string): Planning {
    const dateStr = this.formatDate(date);
    let plan = this.planningData.find(p => p.date === dateStr && p.meal_type === mealType);
    if (!plan) {
      plan = { date: dateStr, meal_type: mealType };
    }
    return plan;
  }

  savePlan(date: Date, mealType: string) {
    const plan = this.getPlan(date, mealType);
    if (plan.main_recipe_id) plan.main_recipe_id = Number(plan.main_recipe_id);
    if (plan.side_recipe_id) plan.side_recipe_id = Number(plan.side_recipe_id);

    this.apiService.upsertPlanning(plan).subscribe(savedPlan => {
      const index = this.planningData.findIndex(p => p.date === plan.date && p.meal_type === plan.meal_type);
      if (index > -1) {
        this.planningData[index] = savedPlan;
      } else {
        this.planningData.push(savedPlan);
      }
    });
  }

  recipesByType(type: string) {
    return this.recipes.filter(r => r.recipe_type === type);
  }

  previous() {
    if (this.viewMode === 'week') {
      this.referenceDate.setDate(this.referenceDate.getDate() - (7 * this.numWeeks));
    } else {
      this.referenceDate.setMonth(this.referenceDate.getMonth() - 1);
    }
    this.updateRange();
  }

  next() {
    if (this.viewMode === 'week') {
      this.referenceDate.setDate(this.referenceDate.getDate() + (7 * this.numWeeks));
    } else {
      this.referenceDate.setMonth(this.referenceDate.getMonth() + 1);
    }
    this.updateRange();
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  // --- Shopping List Selection ---

  toggleShoppingSelect() {
    this.isSelectingShopping = !this.isSelectingShopping;
    this.shoppingStart = null;
    this.shoppingEnd = null;
  }

  selectDate(day: Date) {
    if (!this.isSelectingShopping) return;

    if (!this.shoppingStart) {
      this.shoppingStart = new Date(day);
    } else if (!this.shoppingEnd) {
      if (day < this.shoppingStart) {
        this.shoppingEnd = this.shoppingStart;
        this.shoppingStart = new Date(day);
      } else {
        this.shoppingEnd = new Date(day);
      }
      // Redirect to shopping list
      this.router.navigate(['/shopping-list'], {
        queryParams: {
          start: this.formatDate(this.shoppingStart),
          end: this.formatDate(this.shoppingEnd)
        }
      });
      this.isSelectingShopping = false;
    }
  }

  isDateInRange(day: Date): boolean {
    if (!this.shoppingStart) return false;
    if (!this.shoppingEnd) return day.getTime() === this.shoppingStart.getTime();
    return day >= this.shoppingStart && day <= this.shoppingEnd;
  }
}
