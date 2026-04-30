import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

  {
    path: '',
    canActivate: [guestGuard],
    loadComponent: () => import('./layouts/auth-layout/auth-layout').then((m) => m.AuthLayoutComponent),
    children: [
      { path: 'login', loadComponent: () => import('./features/login/login') },
      { path: 'signup', loadComponent: () => import('./features/signup/signup') },
    ],
  },

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/app-layout/app-layout').then((m) => m.AppLayoutComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard') },
      { path: 'world', loadComponent: () => import('./features/world/world') },
      {
        path: 'world/:id',
        loadComponent: () => import('./features/world/territory-detail'),
      },
      { path: 'businesses', loadComponent: () => import('./features/businesses/businesses') },
      { path: 'army', loadComponent: () => import('./features/army/army') },
      { path: 'battles', loadComponent: () => import('./features/battles/battles') },
      {
        path: 'battles/:id',
        loadComponent: () => import('./features/battles/battle-detail'),
      },
      {
        path: 'missions',
        loadComponent: () => import('./features/placeholder/placeholder'),
        data: { title: 'Missions', description: 'Section F9 — daily / story / achievements.' },
      },
      {
        path: 'leaderboards',
        loadComponent: () => import('./features/placeholder/placeholder'),
        data: { title: 'Leaderboards', description: 'Section F9 — top players by metric.' },
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/placeholder/placeholder'),
        data: { title: 'Notifications', description: 'Section F9 — inbox.' },
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/placeholder/placeholder'),
        data: { title: 'Profile', description: 'Section F2/F3 — avatar, password, account settings.' },
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/placeholder/placeholder'),
        data: { title: 'Admin Panel', description: 'Section F10 — stats, players, catalog CRUD, audit log.' },
      },
    ],
  },

  { path: '**', redirectTo: 'dashboard' },
];
