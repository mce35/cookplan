import { Routes } from '@angular/router';
import { RecipeListComponent } from './components/recipe-list/recipe-list';
import { RecipeDetailComponent } from './components/recipe-detail/recipe-detail';
import { RecipeFormComponent } from './components/recipe-form/recipe-form';
import { PlanningComponent } from './components/planning/planning';
import { ShoppingListComponent } from './components/shopping-list/shopping-list';
import { RecipeSearchComponent } from './components/recipe-search/recipe-search';
import { IngredientManagerComponent } from './components/ingredient-manager/ingredient-manager';

export const routes: Routes = [
  { path: '', redirectTo: '/planning', pathMatch: 'full' },
  { path: 'planning', component: PlanningComponent },
  { path: 'recipes', component: RecipeListComponent },
  { path: 'recipes/new', component: RecipeFormComponent },
  { path: 'recipes/:id', component: RecipeDetailComponent },
  { path: 'recipes/:id/edit', component: RecipeFormComponent },
  { path: 'shopping-list', component: ShoppingListComponent },
  { path: 'search', component: RecipeSearchComponent },
  { path: 'search/:name', component: RecipeSearchComponent },
  { path: 'ingredients', component: IngredientManagerComponent },
];
