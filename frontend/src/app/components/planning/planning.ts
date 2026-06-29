import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Recipe, Planning } from '../../models/models';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule],
  template: `
    <div class="container-fluid">
      <div class="d-flex flex-wrap justify-content-between align-items-center mb-3">
        <h2>Planning</h2>
        <div class="d-flex flex-wrap align-items-center">
          <div *ngIf="viewMode() === 'week'" class="mr-3 d-flex align-items-center">
            <label for="numWeeks" class="mb-0 mr-2">Semaines à afficher:</label>
            <input id="numWeeks" type="number" [ngModel]="numWeeks()" (ngModelChange)="numWeeks.set($event); updateRange()" class="form-control form-control-sm" style="width: 60px" min="1" max="8">
          </div>
          <div class="btn-group mr-3 mt-1">
            <button class="btn btn-outline-primary" [class.active]="viewMode() === 'week'" (click)="setViewMode('week')">Semaine</button>
            <button class="btn btn-outline-primary" [class.active]="viewMode() === 'month'" (click)="setViewMode('month')">Mois</button>
          </div>
          <div class="btn-group mr-3 mt-1">
            <button (click)="previous()" class="btn btn-outline-secondary"><mat-icon style="font-size: 22px; vertical-align: middle">chevron_left</mat-icon></button>
            <button (click)="goToToday()" class="btn btn-primary">Aujourd'hui</button>
            <button (click)="next()" class="btn btn-outline-secondary"><mat-icon style="font-size: 22px; vertical-align: middle">chevron_right</mat-icon></button>
          </div>

          <button (click)="toggleShoppingSelect()" class="btn mt-1" [class.btn-success]="!isSelectingShopping" [class.btn-danger]="isSelectingShopping">
            {{ isSelectingShopping ? 'Annuler Courses' : 'Générer Courses' }}
          </button>
        </div>
      </div>

      <div *ngIf="isSelectingShopping" class="d-flex alert alert-info py-2 mb-3">
        <div class="mr-2 d-flex align-items-center">
          <label for="persons" class="mb-0 mr-2">Personnes:</label>
          <input id="persons" type="number" min="1" [(ngModel)]="persons" class="form-control">
        </div>
        <div class="mr-10 d-flex align-items-center">
          Cliquez sur une date de début puis une date de fin pour générer la liste de courses.
          <span *ngIf="shoppingStart" class="ml-2 font-weight-bold">Début: {{ shoppingStart | date:'shortDate' }}</span>
          <span *ngIf="shoppingEnd" class="ml-2 font-weight-bold">Fin: {{ shoppingEnd | date:'shortDate' }}</span>
        </div>
      </div>

      <div class="planning-grid">
        <div *ngFor="let day of displayDays()"
             class="day-card"
             [class.selecting]="isSelectingShopping"
             [class.selected-range]="isDateInRange(day)"
             [class.past-day]="isPastDay(day)"
             [class.today-day]="isToday(day)"
             [class.upcoming-day]="isUpcomingDay(day)"
             (click)="selectDate(day)">
          <div class="day-header text-center">
            <strong>{{ day | date:'EEEE d MMM' : undefined : 'fr-FR' }}</strong>
          </div>

          <div class="meal-section">
            <div class="meal-label">Midi</div>
            <div class="recipe-select-group" (click)="$event.stopPropagation()">
                <div class="recipe-input-row mb-1">
                  <div class="input-suggestion-box">
                    <input
                      #mainMidiInput
                      type="text"
                      autocomplete="off"
                      class="form-control form-control-sm recipe-autocomplete"
                      [ngModel]="getRecipeText(day, 'midi', 'main')"
                      (focus)="activateSuggestions(day, 'midi', 'main')"
                      (ngModelChange)="onRecipeInputText(day, 'midi', 'main', $event)"
                      (blur)="blurSuggestions(); applyRecipeFromName(day, 'midi', 'main')"
                      (keydown)="onRecipeInputKeydown($event, day, 'midi', 'main')"
                      placeholder="-- Plat --"
                    />
                    <button *ngIf="getPlanId(day, 'midi', 'main')" type="button" class="btn btn-xs btn-outline-info p-0" (click)="viewRecipe(getPlanId(day, 'midi', 'main'))">
                      <mat-icon style="vertical-align: middle;">arrow_forward</mat-icon>
                    </button>
                    <div id="{{getSuggestionListId(day, 'midi', 'main')}}" class="suggestion-list" *ngIf="activeSuggestionKey === getInputKey(day, 'midi', 'main') && getSuggestions(day, 'midi', 'main').length">
                      <button type="button" class="suggestion-item" *ngFor="let suggestion of getSuggestions(day, 'midi', 'main'); let i = index"
                        [class.highlighted]="getHighlightedIndex(getInputKey(day, 'midi', 'main')) === i"
                        (mousedown)="selectSuggestion(day, 'midi', 'main', suggestion.name)"
                        (touchstart)="selectSuggestion(day, 'midi', 'main', suggestion.name)">
                        {{ suggestion.name }}
                      </button>
                    </div>
                  </div>
                </div>
                <div class="recipe-input-row">
                  <div class="input-suggestion-box">
                    <input
                      #sideMidiInput
                      type="text"
                      autocomplete="off"
                      class="form-control form-control-sm recipe-autocomplete"
                      [ngModel]="getRecipeText(day, 'midi', 'side')"
                      (focus)="activateSuggestions(day, 'midi', 'side')"
                      (ngModelChange)="onRecipeInputText(day, 'midi', 'side', $event)"
                      (blur)="blurSuggestions(); applyRecipeFromName(day, 'midi', 'side')"
                      (keydown)="onRecipeInputKeydown($event, day, 'midi', 'side')"
                      placeholder="-- Accomp. --"
                    />
                    <button *ngIf="getPlanId(day, 'midi', 'side')" type="button" class="btn btn-sm btn-outline-info p-0" (click)="viewRecipe(getPlanId(day, 'midi', 'side'))">
                      <mat-icon style="vertical-align: middle;">arrow_forward</mat-icon>
                    </button>
                    <div id="{{getSuggestionListId(day, 'midi', 'side')}}" class="suggestion-list" *ngIf="activeSuggestionKey === getInputKey(day, 'midi', 'side') && getSuggestions(day, 'midi', 'side').length">
                      <button type="button" class="suggestion-item" *ngFor="let suggestion of getSuggestions(day, 'midi', 'side'); let i = index"
                        [class.highlighted]="getHighlightedIndex(getInputKey(day, 'midi', 'side')) === i"
                        (mousedown)="selectSuggestion(day, 'midi', 'side', suggestion.name)"
                        (touchstart)="selectSuggestion(day, 'midi', 'side', suggestion.name)">
                        {{ suggestion.name }}
                      </button>
                    </div>
                  </div>
                </div>
                <div class="recipe-input-row">
                  <input
                    #noteMidiInput
                    type="text"
                    class="form-control form-control-sm"
                    [ngModel]="getNoteText(day, 'midi')"
                    (ngModelChange)="onNoteInputText(day, 'midi', $event)"
                    (blur)="saveNote(day, 'midi')"
                    (keydown.enter)="saveNote(day, 'midi')"
                    placeholder="-- Note --"
                  />
                </div>
            </div>
          </div>

          <div class="meal-section">
            <div class="meal-label">Soir</div>
            <div class="recipe-select-group" (click)="$event.stopPropagation()">
                <div class="recipe-input-row mb-1">
                  <div class="input-suggestion-box">
                    <input
                      #mainSoirInput
                      type="text"
                      autocomplete="off"
                      class="form-control form-control-sm recipe-autocomplete"
                      [ngModel]="getRecipeText(day, 'soir', 'main')"
                      (focus)="activateSuggestions(day, 'soir', 'main')"
                      (ngModelChange)="onRecipeInputText(day, 'soir', 'main', $event)"
                      (blur)="blurSuggestions(); applyRecipeFromName(day, 'soir', 'main')"
                      (keydown)="onRecipeInputKeydown($event, day, 'soir', 'main')"
                      placeholder="-- Plat --"
                    />
                    <button *ngIf="getPlanId(day, 'soir', 'main')" type="button" class="btn btn-sm btn-outline-info p-0" (click)="viewRecipe(getPlanId(day, 'soir', 'main'))">
                      <mat-icon style="vertical-align: middle;">arrow_forward</mat-icon>
                    </button>
                    <div id="{{getSuggestionListId(day, 'soir', 'main')}}" class="suggestion-list" *ngIf="activeSuggestionKey === getInputKey(day, 'soir', 'main') && getSuggestions(day, 'soir', 'main').length">
                      <button type="button" class="suggestion-item" *ngFor="let suggestion of getSuggestions(day, 'soir', 'main'); let i = index"
                        [class.highlighted]="getHighlightedIndex(getInputKey(day, 'soir', 'main')) === i"
                        (mousedown)="selectSuggestion(day, 'soir', 'main', suggestion.name)"
                        (touchstart)="selectSuggestion(day, 'soir', 'main', suggestion.name)">
                        {{ suggestion.name }}
                      </button>
                    </div>
                  </div>
                </div>
                <div class="recipe-input-row">
                  <div class="input-suggestion-box">
                    <input
                      #sideSoirInput
                      type="text"
                      autocomplete="off"
                      class="form-control form-control-sm recipe-autocomplete"
                      [ngModel]="getRecipeText(day, 'soir', 'side')"
                      (focus)="activateSuggestions(day, 'soir', 'side')"
                      (ngModelChange)="onRecipeInputText(day, 'soir', 'side', $event)"
                      (blur)="blurSuggestions(); applyRecipeFromName(day, 'soir', 'side')"
                      (keydown)="onRecipeInputKeydown($event, day, 'soir', 'side')"
                      placeholder="-- Accomp. --"
                    />
                    <button *ngIf="getPlanId(day, 'soir', 'side')" type="button" class="btn btn-sm btn-outline-info p-0" (click)="viewRecipe(getPlanId(day, 'soir', 'side'))">
                      <mat-icon style="vertical-align: middle;">arrow_forward</mat-icon>
                    </button>
                    <div id="{{getSuggestionListId(day, 'soir', 'side')}}" class="suggestion-list" *ngIf="activeSuggestionKey === getInputKey(day, 'soir', 'side') && getSuggestions(day, 'soir', 'side').length">
                      <button type="button" class="suggestion-item" *ngFor="let suggestion of getSuggestions(day, 'soir', 'side'); let i = index"
                        [class.highlighted]="getHighlightedIndex(getInputKey(day, 'soir', 'side')) === i"
                        (mousedown)="selectSuggestion(day, 'soir', 'side', suggestion.name)"
                        (touchstart)="selectSuggestion(day, 'soir', 'side', suggestion.name)">
                        {{ suggestion.name }}
                      </button>
                    </div>
                  </div>
                </div>
                <div class="recipe-input-row">
                  <input
                    #noteSoirInput
                    type="text"
                    class="form-control form-control-sm"
                    [ngModel]="getNoteText(day, 'soir')"
                    (ngModelChange)="onNoteInputText(day, 'soir', $event)"
                    (blur)="saveNote(day, 'soir')"
                    (keydown.enter)="saveNote(day, 'soir')"
                    placeholder="-- Note --"
                  />
                </div>
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
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      grid-auto-flow: row;
      width: 100%;
    }
    .day-card {
      min-width: 0;
      width: 100%;
      box-sizing: border-box;
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
    .day-card.past-day {
      background-color: #f0f0f0;
      border-color: #ced4da;
      color: #6c757d;
    }
    .day-card.today-day {
      background-color: #fff3cd;
      border-color: #ffeeba;
      color: #856404;
    }
    .day-card.upcoming-day {
      background-color: #d4edda;
      border-color: #c3e6cb;
      color: #155724;
    }
    .day-card.today-day .day-header,
    .day-card.past-day .day-header,
    .day-card.upcoming-day .day-header {
      background-color: transparent;
      border-bottom: 1px solid transparent;
      margin-bottom: 10px;
    }
    .meal-section { margin-bottom: 10px; }
    .meal-label { font-weight: bold; font-size: 0.75rem; color: #666; margin-bottom: 2px; }
    .recipe-select-group .recipe-input-row { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-bottom: 4px; position: relative; }
    .recipe-select-group .input-suggestion-box { display: flex; flex: 1 1 100%; flex-wrap: nowrap; align-items: center; gap: 6px; position: relative; }
    .recipe-select-group .input-suggestion-box input { min-width: 0; flex: 1 1 auto; max-width: 100%; }
    .recipe-select-group .input-suggestion-box button { flex: 0 0 auto; white-space: nowrap; }
    .recipe-select-group .suggestion-list { position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 50; max-height: 220px; overflow-y: auto; background: #fff; border: 1px solid #ccc; border-radius: 0 0 5px 5px; box-shadow: 0 4px 10px rgba(0,0,0,0.12); }
    .recipe-select-group .suggestion-item { width: 100%; text-align: left; border: none; background: transparent; padding: 0.4rem 0.5rem; cursor: pointer; }
    .recipe-select-group .suggestion-item:hover { background-color: #f1f1f1; }
    .recipe-select-group .suggestion-item.highlighted { background-color: #e9ecef; }
    .recipe-select-group .recipe-autocomplete { font-size: 0.75rem; }
    .recipe-select-group .recipe-dropdown-button { min-width: 34px; }
    .recipe-select-group .recipe-dropdown-button .material-icons { vertical-align: middle; }
    .mr-2 { margin-right: 10px; }
    .mr-3 { margin-right: 15px; }
  `]
})
export class PlanningComponent implements OnInit {
  displayDays = signal<Date[]>([]);
  recipes = signal<Recipe[]>([]);
  planningData = signal<Planning[]>([]);
  recipeInputValues: Record<string, string> = {};
  noteInputValues: Record<string, string> = {};
  activeSuggestionKey: string | null = null;
  suggestionHideTimeout?: number;
  suggestionIndices: Record<string, number> = {};

  viewMode = signal<'week' | 'month'>('week');
  numWeeks = signal<number>(2);
  referenceDate = signal<Date>(new Date());

  isSelectingShopping = false;
  shoppingStart: Date | null = null;
  shoppingEnd: Date | null = null;
  persons: number = 4;

  constructor(private apiService: ApiService, private router: Router, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadRecipes();
  }

  private async loadRecipes(): Promise<void> {
    try {
    const recipes = await this.apiService.getRecipes().toPromise();
      if(recipes) {
        this.recipes.set(recipes);
      }
      this.updateRange();
    } catch (error) {
      console.error("Cannot load recipes:", error);
      this.snackBar.open("Impossible de charger les recettes", 'OK', {
        duration: 4000,
        panelClass: ['custom-snackbar']
      });
    }
  }

  setViewMode(mode: 'week' | 'month') {
    this.viewMode.set(mode);
    this.updateRange();
  }

  updateRange() {
    if (this.viewMode() === 'week') {
      this.calculateWeeks();
    } else {
      this.calculateMonth();
    }
    this.loadPlanning();
  }

  calculateWeeks() {
    const start = new Date(this.referenceDate());
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0,0,0,0);

    const days: Date[] = [];
    const totalDays = this.numWeeks() * 7;
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    this.displayDays.set(days);
  }

  calculateMonth() {
    const ref = this.referenceDate();
    const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
    // Adjust to Monday of the first week of the month
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    start.setHours(0,0,0,0);

    const days: Date[] = [];
    // Always show 6 weeks for a consistent month view
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    this.displayDays.set(days);
  }

  loadPlanning() {
    const days = this.displayDays();
    if (days.length === 0) return;
    const start = this.formatDate(days[0]);
    const end = this.formatDate(days[days.length - 1]);
    this.apiService.getPlanning(start, end).subscribe(data => {
      this.planningData.set(data);
    });
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getPlanId(date: Date, mealType: string, recipeType: 'main' | 'side'): number | null {
    const dateStr = this.formatDate(date);
    const plan = this.planningData().find(p => p.date === dateStr && p.meal_type === mealType);
    if (!plan)
      return null;
    return recipeType === 'main' ? (plan.main_recipe_id ?? null) : (plan.side_recipe_id ?? null);
  }

  getInputKey(date: Date, mealType: string, recipeType: 'main' | 'side'): string {
    return `${this.formatDate(date)}|${mealType}|${recipeType}`;
  }

  /*
    [attr.list]="getDatalistId(day, 'soir', 'main')"
    ...
    <datalist [id]="getDatalistId(day, 'soir', 'main')">
      <option *ngFor="let r of recipesByType('plat')" [value]="r.name"></option>
    </datalist>
  */
  getDatalistId(date: Date, mealType: string, recipeType: 'main' | 'side'): string {
    return `recipe-options-${this.formatDate(date)}-${mealType}-${recipeType}`;
  }

  getRecipeNameById(id: number | null): string | null {
    return this.recipes().find(recipe => recipe.id === id)?.name ?? null;
  }

  getRecipeText(date: Date, mealType: string, recipeType: 'main' | 'side'): string {
    const key = this.getInputKey(date, mealType, recipeType);
    if (this.recipeInputValues[key] !== undefined) {
      return this.recipeInputValues[key];
    }
    const planId = this.getPlanId(date, mealType, recipeType);
    return planId ? this.getRecipeNameById(planId) ?? '' : '';
  }

  activateSuggestions(date: Date, mealType: string, recipeType: 'main' | 'side') {
    this.cancelSuggestionHide();
    this.activeSuggestionKey = this.getInputKey(date, mealType, recipeType);
  }

  blurSuggestions() {
    this.suggestionHideTimeout = window.setTimeout(() => {
      // clear highlighted index for the currently active input
      if (this.activeSuggestionKey) {
        this.suggestionIndices[this.activeSuggestionKey] = -1;
      }
      this.activeSuggestionKey = null;
      this.suggestionHideTimeout = undefined;
    }, 150);
  }

  getHighlightedIndex(key: string) {
    return this.suggestionIndices[key] ?? -1;
  }

  onRecipeInputKeydown(event: KeyboardEvent, date: Date, mealType: string, recipeType: 'main' | 'side') {
    const key = this.getInputKey(date, mealType, recipeType);
    const suggestions = this.getSuggestions(date, mealType, recipeType);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeSuggestionKey = key;
      const current = this.suggestionIndices[key] ?? -1;
      const next = suggestions.length ? (current + 1) % suggestions.length : -1;
      this.suggestionIndices[key] = next;
      this.scrollSuggestionIntoView(date, mealType, recipeType, next);
      this.cancelSuggestionHide();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeSuggestionKey = key;
      const current = this.suggestionIndices[key] ?? -1;
      const next = suggestions.length ? (current <= 0 ? suggestions.length - 1 : current - 1) : -1;
      this.suggestionIndices[key] = next;
      this.scrollSuggestionIntoView(date, mealType, recipeType, next);
      this.cancelSuggestionHide();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const idx = this.suggestionIndices[key] ?? -1;
      if (idx >= 0 && suggestions[idx]) {
        this.selectSuggestion(date, mealType, recipeType, suggestions[idx].name);
      } else {
        this.applyRecipeFromName(date, mealType, recipeType);
      }
    } else if (event.key === 'Escape') {
      this.activeSuggestionKey = null;
    }
  }

  getSuggestionListId(date: Date, mealType: string, recipeType: 'main' | 'side') {
    return `suggestions-${this.formatDate(date)}-${mealType}-${recipeType}`;
  }

  scrollSuggestionIntoView(date: Date, mealType: string, recipeType: 'main' | 'side', index: number) {
    if (index == null || index < 0) return;
    const id = this.getSuggestionListId(date, mealType, recipeType);
    // use setTimeout to ensure DOM is updated
    setTimeout(() => {
      const list = document.getElementById(id);
      if (!list) return;
      const items = list.querySelectorAll('.suggestion-item');
      const el = items[index] as HTMLElement | undefined;
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }, 0);
  }

  cancelSuggestionHide() {
    if (this.suggestionHideTimeout !== undefined) {
      clearTimeout(this.suggestionHideTimeout);
      this.suggestionHideTimeout = undefined;
    }
  }

  getSuggestions(date: Date, mealType: string, recipeType: 'main' | 'side') {
    const key = this.getInputKey(date, mealType, recipeType);
    const text = this.recipeInputValues[key]?.trim().toLowerCase() ?? '';
    if (!text) {
      return [];
    }
    const wantedType = recipeType === 'main' ? 'plat' : 'accompagnement';
    return this.recipes()
      .filter(r => r.recipe_type === wantedType && r.name.toLowerCase().includes(text))
      .slice(0, 15);
  }

  selectSuggestion(date: Date, mealType: string, recipeType: 'main' | 'side', recipeName: string) {
    const key = this.getInputKey(date, mealType, recipeType);
    this.recipeInputValues[key] = recipeName;
    this.applyRecipeFromName(date, mealType, recipeType);
    this.suggestionIndices[key] = -1;
    this.activeSuggestionKey = null;
    this.cancelSuggestionHide();
  }

  onRecipeInputText(date: Date, mealType: string, recipeType: 'main' | 'side', value: string) {
    const key = this.getInputKey(date, mealType, recipeType);
    this.recipeInputValues[key] = value;
    this.suggestionIndices[key] = -1;
  }

  applyRecipeFromName(date: Date, mealType: string, recipeType: 'main' | 'side') {
    const key = this.getInputKey(date, mealType, recipeType);
    const name = this.recipeInputValues[key]??'';
    const wantedType = recipeType === 'main' ? 'plat' : 'accompagnement';
    const recipe = this.recipes().find(r => r.recipe_type === wantedType && r.name === name);
    const recipeId = recipe ? recipe.id : null;
    this.updatePlanId(date, mealType, recipeType, recipeId);
    if (!recipeId) {
      delete this.recipeInputValues[key];
    }
  }

  updatePlanId(date: Date, mealType: string, recipeType: 'main' | 'side', recipeId: any) {
    const dateStr = this.formatDate(date);
    let plan = this.planningData().find(p => p.date === dateStr && p.meal_type === mealType);

    if (!plan) {
      plan = { date: dateStr, meal_type: mealType };
    } else {
      plan = { ...plan }; // Clone
    }

    const id = recipeId ? Number(recipeId) : undefined;
    if (recipeType === 'main') {
      plan.main_recipe_id = id;
    } else {
      plan.side_recipe_id = id;
    }

    this.apiService.upsertPlanning(plan).subscribe(savedPlan => {
      const data = [...this.planningData()];
      const index = data.findIndex(p => p.date === dateStr && p.meal_type === mealType);
      if (index > -1) {
        data[index] = savedPlan;
      } else {
        data.push(savedPlan);
      }
      this.planningData.set(data);
    });
  }

  getNoteInputKey(date: Date, mealType: string): string {
    return `${this.formatDate(date)}|${mealType}`;
  }

  getNoteText(date: Date, mealType: string): string {
    const key = this.getNoteInputKey(date, mealType);
    if (this.noteInputValues[key] !== undefined) {
      return this.noteInputValues[key];
    }
    const dateStr = this.formatDate(date);
    const plan = this.planningData().find(p => p.date === dateStr && p.meal_type === mealType);
    return plan?.note ?? '';
  }

  onNoteInputText(date: Date, mealType: string, value: string) {
    const key = this.getNoteInputKey(date, mealType);
    this.noteInputValues[key] = value;
  }

  saveNote(date: Date, mealType: string) {
    const key = this.getNoteInputKey(date, mealType);
    const note = this.noteInputValues[key];
    const dateStr = this.formatDate(date);
    let plan = this.planningData().find(p => p.date === dateStr && p.meal_type === mealType);

    if (!plan) {
      plan = { date: dateStr, meal_type: mealType };
    } else {
      plan = { ...plan }; // Clone
    }

    plan.note = note || undefined;

    this.apiService.upsertPlanning(plan).subscribe(savedPlan => {
      const data = [...this.planningData()];
      const index = data.findIndex(p => p.date === dateStr && p.meal_type === mealType);
      if (index > -1) {
        data[index] = savedPlan;
      } else {
        data.push(savedPlan);
      }
      this.planningData.set(data);
      // Keep the input value in sync with what was saved
      if (savedPlan.note) {
        this.noteInputValues[key] = savedPlan.note;
      } else {
        delete this.noteInputValues[key];
      }
    });
  }

  viewRecipe(recipeId: number | null) {
    if (recipeId) {
      this.router.navigate(['/recipes', recipeId]);
    }
  }

  recipesByType(type: string) {
    return this.recipes().filter(r => r.recipe_type === type);
  }

  previous() {
    const ref = new Date(this.referenceDate());
    if (this.viewMode() === 'week') {
      ref.setDate(ref.getDate() - 7);
    } else {
      ref.setMonth(ref.getMonth() - 1);
    }
    this.referenceDate.set(ref);
    this.updateRange();
  }

  next() {
    const ref = new Date(this.referenceDate());
    if (this.viewMode() === 'week') {
      ref.setDate(ref.getDate() + 7);
    } else {
      ref.setMonth(ref.getMonth() + 1);
    }
    this.referenceDate.set(ref);
    this.updateRange();
  }

  goToToday() {
    this.referenceDate.set(new Date());
    this.updateRange();
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  isPastDay(date: Date): boolean {
    const today = new Date();
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return normalizedDate < normalizedToday;
  }

  isUpcomingDay(date: Date): boolean {
    const today = new Date();
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return normalizedDate > normalizedToday;
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
          end: this.formatDate(this.shoppingEnd),
          persons: this.persons
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
