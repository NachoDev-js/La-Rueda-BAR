import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../interfaces/producto';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.scss'
})
export class ProductosComponent implements OnInit {
  private productoService = inject(ProductoService);
  private cdr = inject(ChangeDetectorRef);
  productos: Producto[] = [];

  nuevoProducto: Producto = { nombre: '', precio: 0, categoria: 'Bebidas' };

  ngOnInit(): void {
    this.cargarMenu();
  }

  cargarMenu() {
    this.productoService.getProductos().subscribe({
      next: (data) => {
        this.productos = data;

        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar', err)
    });
  }
  esValido(): boolean {
    return this.nuevoProducto.nombre.trim() !== '' &&
      this.nuevoProducto.precio > 0 &&
      this.nuevoProducto.categoria !== '';
  }

  guardar() {
    if (!this.esValido()) {
      alert('Por favor, completá todos los campos correctamente.');
      return;
    }

    if (this.nuevoProducto.id) {
      this.productoService.actualizarProducto(this.nuevoProducto.id, this.nuevoProducto).subscribe({
        next: () => {
          this.cargarMenu();
          this.limpiarFormulario();

          this.cdr.detectChanges();

        },
        error: (err) => console.error('Error al actualizar', err)
      });
    } else {
      this.productoService.crearProducto(this.nuevoProducto).subscribe({
        next: (prod) => {
          this.productos.push(prod);
          this.limpiarFormulario();

          this.cdr.detectChanges();

        },
        error: (err) => console.error('Error al guardar', err)
      });
    }
  }
  editar(producto: Producto) {
    this.nuevoProducto = { ...producto };
  }

  eliminar(id: number | undefined) {
    if (id && confirm('¿Estás seguro de eliminar este producto?')) {
      this.productoService.eliminarProducto(id).subscribe({
        next: () => {
          this.productos = this.productos.filter(p => p.id !== id);

          this.cdr.detectChanges();

        },
        error: (err) => console.error('Error al eliminar', err)
      });
    }
  }

  limpiarFormulario() {
    this.nuevoProducto = {
      nombre: '',
      precio: 0,
      categoria: 'Bebidas'
    };
  }
}
