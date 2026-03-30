import { Component, signal } from '@angular/core';
import { ProductosComponent } from './components/productos/productos.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ProductosComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'BarFrontend';
}
