import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Recipe, Planning } from '../../models/models';

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2>Planning de la semaine</h2>
        <div>
          <button (click)="previousWeek()" class="btn btn-outline-secondary mr-2">Semaine Précédente</button>
          <button (click)="nextWeek()" class="btn btn-outline-secondary">Semaine Suivante</button>
        </div>
      </div>

      <div class="planning-grid">
        <div *ngFor="let day of weekDays" class="day-card">
          <div class="day-header text-center">
            <strong>{{ day | date:'EEEE d' : undefined : 'fr-FR' }}</strong>
          </div>

          <div class="meal-section">
            <div class="meal-label">Midi</div>
            <div class="recipe-select-group">
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
            <div class="recipe-select-group">
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
      grid-template-columns: repeat(7, 1fr);
      gap: 10px;
    }
    .day-card {
      border: 1px solid #c3e6cb;
      border-radius: 5px;
      padding: 5px;
      background-color: #f8fff9;
    }
    .day-header {
      background-color: #e2f3e5;
      margin: -5px -5px 10px -5px;
      padding: 5px;
      border-bottom: 1px solid #c3e6cb;
      font-size: 0.9rem;
    }
    .meal-section {
      margin-bottom: 15px;
    }
    .meal-label {
      font-weight: bold;
      font-size: 0.8rem;
      color: #666;
      margin-bottom: 3px;
    }
    .recipe-select-group select {
      font-size: 0.8rem;
    }
    .mr-2 { margin-right: 10px; }
  `]
})
export class PlanningComponent implements OnInit {
  weekDays: Date[] = [];
  recipes: Recipe[] = [];
  planningData: Planning[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.setWeek(new Date());
    this.apiService.getRecipes().subscribe(data => this.recipes = data);
  }

  setWeek(referenceDate: Date) {
    const start = new Date(referenceDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    start.setDate(diff);

    this.weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      this.weekDays.push(d);
    }
    this.loadPlanning();
  }

  loadPlanning() {
    const start = this.formatDate(this.weekDays[0]);
    const end = this.formatDate(this.weekDays[6]);
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
    // Convert string IDs back to numbers if needed (Angular often binds select as string)
    if (plan.main_recipe_id) plan.main_recipe_id = Number(plan.main_recipe_id);
    if (plan.side_recipe_id) plan.side_recipe_id = Number(plan.side_recipe_id);

    this.apiService.upsertPlanning(plan).subscribe(savedPlan => {
      // Update local data
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

  previousWeek() {
    const d = new Date(this.weekDays[0]);
    d.setDate(d.getDate() - 7);
    this.setWeek(d);
  }

  nextWeek() {
    const d = new Date(this.weekDays[0]);
    d.setDate(d.getDate() + 7);
    this.setWeek(d);
  }
}
