import { Routes } from '@angular/router';
import { authGuard } from './core/Auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // ====================== RUTAS PÚBLICAS ======================
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.Login),
  },

  {
    path: 'home',
    loadComponent: () => import('./pages/home/home').then(m => m.Home),
  },

  {
    path: 'destinos',
    loadComponent: () => import('./pages/destinos/destinos').then(m => m.Destinos),
  },

  {
    path: 'destinos/:id',
    loadComponent: () => import('./pages/destino-detalle/destino-detalle').then(m => m.DestinoDetalle),
  },

  {
    path: 'paquetes',
    loadComponent: () => import('./pages/paquetes/paquetes').then(m => m.PaquetesPublicos),
  },

  {
    path: 'paquetes/:id',
    loadComponent: () => import('./pages/paquete-detalle/paquete-detalle').then(m => m.PaqueteDetalle),
  },

  {
    path: 'reservas',
    loadComponent: () => import('./pages/reservas/reservas').then(m => m.Reservas),
  },

  {
    path: 'contacto',
    loadComponent: () => import('./pages/contacto/contacto').then(m => m.Contacto),
  },

  {
    path: 'nosotros',
    loadComponent: () => import('./pages/nosotros/nosotros').then(m => m.Nosotros),
  },

  // ====================== DASHBOARD ADMIN (Protegido) ======================
  {
    path: 'dash',
    loadComponent: () => import('./dash/dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },

      { 
        path: 'overview', 
        loadComponent: () => import('./dash/dashboard/dashboard').then(m => m.Dashboard) 
      }, // Reutilizamos el mismo componente para overview

      { 
        path: 'usuarios', 
        loadComponent: () => import('./dash/users/users').then(m => m.Users) 
      },
      { 
        path: 'destinos', 
        loadComponent: () => import('./dash/destinos/destinos').then(m => m.Destinos) 
      },
      { 
        path: 'tours', 
        loadComponent: () => import('./dash/tours/tours').then(m => m.Tours) 
      },
      { 
        path: 'reservas', 
        loadComponent: () => import('./dash/reservas/reservas').then(m => m.Reservas) 
      },
      { 
        path: 'pagos', 
        loadComponent: () => import('./dash/pagos/pagos').then(m => m.Pagos) 
      },
      { 
        path: 'autos', 
        loadComponent: () => import('./dash/autos/autos').then(m => m.Autos) 
      },
      { 
        path: 'asientos', 
        loadComponent: () => import('./dash/asientos/asientos').then(m => m.Asientos) 
      },
      {
        path: 'ofertas',
        loadComponent: () => import('./dash/ofertas/ofertas').then(m => m.Ofertas)
      },
      {
        path: 'paquetes',
        loadComponent: () => import('./dash/paquetes/paquetes').then(m => m.Paquetes)
      },
    ]
  },

  { path: '**', redirectTo: 'home' }
];
