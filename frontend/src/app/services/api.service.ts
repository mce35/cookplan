import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Recipe, Ingredient, Planning, ShoppingItem, RecipeShort } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Authentication
  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login/`, { username, password });
  }

  refresh(): Observable<any> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http.post<any>(`${this.apiUrl}/refresh/`, { refresh_token: refreshToken });
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }

  // Ingredients
  getIngredients(): Observable<Ingredient[]> {
    return this.http.get<Ingredient[]>(`${this.apiUrl}/ingredients/`);
  }

  createIngredient(ingredient: Ingredient): Observable<Ingredient> {
    return this.http.post<Ingredient>(`${this.apiUrl}/ingredients/`, ingredient);
  }

  updateIngredient(id: number, ingredient: Ingredient): Observable<Ingredient> {
    return this.http.put<Ingredient>(`${this.apiUrl}/ingredients/${id}`, ingredient);
  }

  deleteIngredient(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/ingredients/${id}`);
  }

  // Recipes
  getRecipes(): Observable<Recipe[]> {
    return this.http.get<Recipe[]>(`${this.apiUrl}/recipes/?skip=0&limit=1000`);
  }

  getRecipesPage(page = 1, pageSize = 20): Observable<HttpResponse<Recipe[]>> {
    const skip = (page - 1) * pageSize;
    return this.http.get<Recipe[]>(`${this.apiUrl}/recipes/?skip=${skip}&limit=${pageSize}`, { observe: 'response' });
  }

  getRecipe(id: number): Observable<Recipe> {
    return this.http.get<Recipe>(`${this.apiUrl}/recipes/${id}`);
  }

  createRecipe(recipe: Recipe): Observable<Recipe> {
    return this.http.post<Recipe>(`${this.apiUrl}/recipes/`, recipe);
  }

  updateRecipe(id: number, recipe: Recipe): Observable<Recipe> {
    return this.http.put<Recipe>(`${this.apiUrl}/recipes/${id}`, recipe);
  }

  deleteRecipe(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/recipes/${id}`);
  }

  // Planning
  getPlanning(startDate: string, endDate: string): Observable<Planning[]> {
    return this.http.get<Planning[]>(`${this.apiUrl}/planning/?start_date=${startDate}&end_date=${endDate}`);
  }

  upsertPlanning(plan: Planning): Observable<Planning> {
    return this.http.post<Planning>(`${this.apiUrl}/planning/`, plan);
  }

  // Shopping List
  getShoppingList(startDate: string, endDate: string, persons: number = 1): Observable<ShoppingItem[]> {
    return this.http.get<ShoppingItem[]>(`${this.apiUrl}/shopping-list/?start_date=${startDate}&end_date=${endDate}&persons=${persons}`);
  }

  // Search
  searchRecipesByIngredient(name: string, page = 1, pageSize = 10): Observable<HttpResponse<RecipeShort[]>> {
    const skip = (page - 1) * pageSize;
    const encodedName = encodeURIComponent(name);
    return this.http.get<RecipeShort[]>(`${this.apiUrl}/recipes-by-ingredient/${encodedName}?skip=${skip}&limit=${pageSize}`, { observe: 'response' });
  }
}
