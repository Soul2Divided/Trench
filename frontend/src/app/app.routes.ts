import { Routes } from '@angular/router';

import { requiereSesion } from './guards/requiere-sesion.guard';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login',
    },
    {
        path: 'login',
        loadComponent: () => import('./components/login/login').then(m => m.Login)
    },
    {
        path: 'publicaciones',
        canActivate: [requiereSesion],
        loadComponent: () => import('./components/publicaciones/publicaciones').then(m => m.Publicaciones),
    },
    {
        path: 'mi-perfil',
        canActivate: [requiereSesion],
        loadComponent: () => import('./components/mi-perfil/mi-perfil').then(m => m.MiPerfil),
    },
    {
        path: '**',
        redirectTo: '',
    },
];
