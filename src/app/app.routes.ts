import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/landing', pathMatch: 'full' },
  { 
    path: 'landing', 
    loadComponent: () => import('./pages/landing/landing').then(c => c.Landing)
  },
  { 
    path: 'explore', 
    loadComponent: () => import('./pages/explore/explore').then(c => c.Explore)
  },
  { 
    path: 'admin', 
    loadComponent: () => import('./pages/admin/admin').then(c => c.Admin)
  },
  { path: '**', redirectTo: '/landing' }
];