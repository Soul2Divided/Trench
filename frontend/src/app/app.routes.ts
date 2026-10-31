import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./components/login/login').then(m => m.Login)
    },
    {
        path: 'publicaciones',
        loadComponent: () => import('./components/publicaciones/publicaciones').then(m => m.Publicaciones)
    },
    {
        path: 'mi-perfil',
        loadComponent: () => import('./components/mi-perfil/mi-perfil').then(m => m.MiPerfil)
    },
];
