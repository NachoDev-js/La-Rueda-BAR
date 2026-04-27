import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../interfaces/producto';


@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.scss'
})
export class InventarioComponent implements OnInit {
  private productoService = inject(ProductoService);
  private cdr = inject(ChangeDetectorRef);

  productos: Producto[] = [];

  ngOnInit() {
    this.cargarInventario();
  }

  cargarInventario() {
    this.productoService.getProductos().subscribe({
      next: (data) => {
        this.productos = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar stock', err)
    });
  }

  ajustarStock(producto: Producto, cantidad: number) {
    const nuevoStock = Math.max(0, (producto.stockActual || 0) + cantidad);

    const productoActualizado = { ...producto, stockActual: nuevoStock };

    if (producto.id) {
      this.productoService.actualizarProducto(producto.id, productoActualizado).subscribe({
        next: () => {
          producto.stockActual = nuevoStock;
          this.cdr.detectChanges();
        },
        error: (err) => alert('Error al actualizar el stock en la base de datos.')
      });
    }
  }
}
