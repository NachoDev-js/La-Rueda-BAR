import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../interfaces/producto';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [FormsModule], // Necesario para usar los inputs del formulario
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.scss'
})
export class ProductosComponent implements OnInit {
  private productoService = inject(ProductoService);

  productos: Producto[] = [];

  nuevoProducto: Producto = {
    nombre: '',
    precio: 0,
    categoria: ''
  };

  ngOnInit(): void {
    this.cargarMenu();
  }

  cargarMenu() {
    this.productoService.getProductos().subscribe({
      next: (data) => this.productos = data,
      error: (err) => console.error('Error al cargar el menú', err)
    });
  }

  guardar() {
    this.productoService.crearProducto(this.nuevoProducto).subscribe({
      next: (productoCreado) => {
        this.productos.push(productoCreado);
        this.nuevoProducto = { nombre: '', precio: 0, categoria: '' };
      },
      error: (err) => console.error('Error al guardar', err)
    });
  }
}
