import { Routes } from '@angular/router';
import { RecipeListComponent } from './components/recipe-list/recipe-list';
import { RecipeDetailComponent } from './components/recipe-detail/recipe-detail';
import { RecipeFormComponent } from './components/recipe-form/recipe-form';
import { PlanningComponent } from './components/planning/planning';
import { ShoppingListComponent } from './components/shopping-list/shopping-list';
import { RecipeSearchComponent } from './components/recipe-search/recipe-search';
import { IngredientManagerComponent } from './components/ingredient-manager/ingredient-manager';
import { LoginComponent } from './components/login/login';
import { AuthGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/planning', pathMatch: 'full' },
  { path: 'planning', component: PlanningComponent, canActivate: [AuthGuard] },
  { path: 'recipes', component: RecipeListComponent, canActivate: [AuthGuard] },
  { path: 'recipes/new', component: RecipeFormComponent, canActivate: [AuthGuard] },
  { path: 'recipes/:id', component: RecipeDetailComponent, canActivate: [AuthGuard] },
  { path: 'recipes/:id/edit', component: RecipeFormComponent, canActivate: [AuthGuard] },
  { path: 'shopping-list', component: ShoppingListComponent, canActivate: [AuthGuard] },
  { path: 'search', component: RecipeSearchComponent, canActivate: [AuthGuard] },
  { path: 'search/:name', component: RecipeSearchComponent, canActivate: [AuthGuard] },
  { path: 'ingredients', component: IngredientManagerComponent, canActivate: [AuthGuard] },
];
