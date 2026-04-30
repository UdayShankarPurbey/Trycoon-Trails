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
      {
        path: 'world',
        loadComponent: () => import('./features/placeholder/placeholder'),
        data: { title: 'World Map', description: 'Section F4 — 50×50 grid view with terrain.' },
      },
      {
        path: 'businesses',
        loadComponent: () => import('./features/placeholder/placeholder'),
        data: { title: 'Businesses', description: 'Section F6 — buy / upgrade / collect.' },
      },
      {
        path: 'army',
        loadComponent: () => import('./features/placeholder/placeholder'),
        data: { title: 'Army', description: 'Section F7 — recruit / disband / strength.' },
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
