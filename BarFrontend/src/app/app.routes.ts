import { Routes } from '@angular/router';
import { ProductosComponent } from './components/productos/productos.component';
import { MesasComponent } from './components/mesas/mesas.component';

export const routes: Routes = [
  { path: 'productos', component: ProductosComponent },

  { path: 'mesas', component: MesasComponent },

  { path: '', redirectTo: '/productos', pathMatch: 'full' }
];
