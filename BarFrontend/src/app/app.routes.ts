import { Routes } from '@angular/router';
import { ProductosComponent } from './components/productos/productos.component';
import { MesasComponent } from './components/mesas/mesas.component';
import { InventarioComponent } from './components/inventario/inventario.component';
import { DashboardComponent } from './components/dashboard/dashboard.component'; 

export const routes: Routes = [
  { path: 'productos', component: ProductosComponent },

  { path: 'mesas', component: MesasComponent },

  { path: '', redirectTo: '/productos', pathMatch: 'full' },

  { path: 'inventario', component: InventarioComponent },

  { path: 'dashboard', component: DashboardComponent }
];
