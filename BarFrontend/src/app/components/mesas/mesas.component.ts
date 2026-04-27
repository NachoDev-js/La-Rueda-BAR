import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, CdkDragEnter } from '@angular/cdk/drag-drop';
import { MesaService } from '../../services/mesa.service';
import { Mesa } from '../../interfaces/mesa';
import { ComandaService } from '../../services/comanda.service';
import { Comanda } from '../../interfaces/comanda';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../interfaces/producto';

@Component({
  selector: 'app-mesas',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './mesas.component.html',
  styleUrls: ['./mesas.component.scss']
})
export class MesasComponent implements OnInit {

  // --- DATOS ---
  mesasInterior: Mesa[] = [];
  mesasExterior: Mesa[] = [];
  productosMenu: Producto[] = [];

  // --- ESTADOS ---
  panelAbierto = false;
  mesaActiva: any = null;
  comandaActiva: any = null;
  esVentaRapida = false;
  mostrandoPago = false;

  // --- FORMULARIOS ---
  nuevaMesa: any = { sector: 'Interior', esPool: false, numero: 0, estado: 'Libre' };
  textoBusqueda: string = '';
  productoSeleccionadoId: number = 0;
  cantidadSeleccionada: number = 1;
  metodoPagoSeleccionado = 'Efectivo';
  montoEntregado = 0;

  loading: boolean = true;

  constructor(
    private mesaService: MesaService,
    private comandaService: ComandaService,
    private productoService: ProductoService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.cargarMesas();
    this.cargarProductosMenu();
    setInterval(() => { this.cdr.detectChanges(); }, 1000);
  }

  // ==========================================
  // GETTERS (Cálculos en tiempo real)
  // ==========================================

  get productosFiltrados() {
    if (!this.textoBusqueda) return this.productosMenu;
    return this.productosMenu.filter(p => p.nombre.toLowerCase().includes(this.textoBusqueda.toLowerCase()));
  }

  get subtotalProductos(): number {
    if (!this.comandaActiva || !this.comandaActiva.detalles) return 0;
    return this.comandaActiva.detalles.reduce((suma: number, item: any) => suma + (item.precioUnitario * item.cantidad), 0);
  }

  get recargoPoolActual(): number {
    if (this.mesaActiva?.esPool && this.mesaActiva?.horaInicioPool) {
      return this.calcularCostoPoolEnVivo(this.mesaActiva.horaInicioPool);
    }
    return 0;
  }

  get totalComandaActual(): number {
    return this.subtotalProductos + this.recargoPoolActual;
  }

  get vuelto(): number {
    return this.montoEntregado - this.totalComandaActual;
  }

  // ==========================================
  // GESTIÓN DE MESAS (UI Optimista y Drag&Drop)
  // ==========================================

  cargarMesas() {
    this.loading = true; // Empezamos mostrando el esqueleto

    this.mesaService.getMesas().subscribe({
      next: (data) => {
        // Separamos por sector como ya lo venías haciendo
        this.mesasInterior = data.filter(m => m.sector === 'Interior');
        this.mesasExterior = data.filter(m => m.sector === 'Exterior');

        this.ordenarListasLocales();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  cargarProductosMenu() {
    this.productoService.getProductos().subscribe(prods => this.productosMenu = prods);
  }

  guardar() {
    const todas = [...this.mesasInterior, ...this.mesasExterior];

    // Calculamos el máximo número para la etiqueta de la mesa
    const maxNum = todas.length > 0 ? Math.max(...todas.map(m => m.numero)) : 0;
    this.nuevaMesa.numero = maxNum + 1;

    // NUEVO: Calculamos el máximo orden para la posición física
    // Usamos || 0 por si alguna mesa vieja tiene el campo orden como undefined
    const maxOrden = todas.length > 0 ? Math.max(...todas.map(m => m.orden || 0)) : 0;
    this.nuevaMesa.orden = maxOrden + 1;

    // UI Optimista (agregamos el orden aquí también para que se vea bien antes de que responda el server)
    const temp = { ...this.nuevaMesa, id: 0, orden: this.nuevaMesa.orden };

    if (this.nuevaMesa.sector === 'Interior') {
      this.mesasInterior.push(temp);
    } else {
      this.mesasExterior.push(temp);
    }

    this.mesaService.crearMesa(this.nuevaMesa as Mesa).subscribe({
      next: () => {
        this.cargarMesas();
        // Reseteamos el objeto incluyendo el campo orden
        this.nuevaMesa = { sector: 'Interior', esPool: false, numero: 0, estado: 'Libre', orden: 0 };
      },
      error: () => this.cargarMesas()
    });
  }

  eliminar(id: number | undefined) {
    if (!id) return;
    if (confirm('¿Borrar mesa?')) {
      this.mesasInterior = this.mesasInterior.filter(m => m.id !== id);
      this.mesasExterior = this.mesasExterior.filter(m => m.id !== id);
      this.mesaService.eliminarMesa(id).subscribe({ error: () => this.cargarMesas() });
    }
  }

  alSoltar(event: CdkDragDrop<any>) {
    // 1. Si se soltó en el mismo lugar, no hacemos nada
    if (event.previousContainer === event.container) return;

    const mesaArrastrada = event.item.data;
    const mesaDestino = event.container.data;

    if (mesaArrastrada && mesaDestino) {
      // --- INTERCAMBIO TOTAL DE POSICIÓN ---

      // Intercambiamos el Orden (para la posición en la grilla)
      const ordenAux = mesaArrastrada.orden;
      mesaArrastrada.orden = mesaDestino.orden;
      mesaDestino.orden = ordenAux;

      // ¡CLAVE!: Intercambiamos los Sectores
      // Si movés una del Interior al lugar de una del Exterior, ahora la arrastrada es Exterior
      const sectorAux = mesaArrastrada.sector;
      mesaArrastrada.sector = mesaDestino.sector;
      mesaDestino.sector = sectorAux;

      // 2. Persistimos en el servidor (Actualizamos ambas mesas)
      this.mesaService.actualizarMesa(mesaArrastrada).subscribe({
        next: () => console.log(`${mesaArrastrada.numero} ahora es ${mesaArrastrada.sector}`),
        error: () => this.cargarMesas()
      });

      this.mesaService.actualizarMesa(mesaDestino).subscribe({
        next: () => console.log(`${mesaDestino.numero} ahora es ${mesaDestino.sector}`),
        error: () => this.cargarMesas()
      });

      // 3. Forzamos la actualización de los arrays locales para que los @if y filtros reaccionen
      // Esto es necesario porque al cambiar el sector, la mesa debe "saltar" de un array al otro
      this.sincronizarArraysLocales();
    }
  }

  sincronizarArraysLocales() {
    // Combinamos todo lo que tenemos en pantalla
    const todas = [...this.mesasInterior, ...this.mesasExterior];

    // Volvemos a filtrar y ordenar
    this.mesasInterior = todas
      .filter(m => m.sector === 'Interior')
      .sort((a, b) => (a.orden || 0) - (b.orden || 0));

    this.mesasExterior = todas
      .filter(m => m.sector === 'Exterior')
      .sort((a, b) => (a.orden || 0) - (b.orden || 0));
  }

  // Función auxiliar para mantener el orden visual
  ordenarListasLocales() {
    this.mesasInterior.sort((a, b) => (a.orden || 0) - (b.orden || 0));
    this.mesasExterior.sort((a, b) => (a.orden || 0) - (b.orden || 0));
  }

  alEntrar(event: any) { }

  // ==========================================
  // COMANDAS Y TICKETS
  // ==========================================

  abrirPanel(mesa: any) {
    this.mesaActiva = mesa;
    this.panelAbierto = true;
    this.esVentaRapida = false;
    this.mostrandoPago = false;
    if (mesa.estado === 'Ocupada') {
      this.comandaService.getComandaActiva(mesa.id).subscribe(c => this.comandaActiva = c);
    } else {
      this.comandaActiva = null;
    }
  }

  cerrarPanel() {
    this.panelAbierto = false;
    this.mesaActiva = null;
    this.esVentaRapida = false;
  }

  abrirCuenta() {
    if (!this.mesaActiva) return;

    this.mesaActiva.estado = 'Ocupada';
    if (this.mesaActiva.esPool) this.mesaActiva.horaInicioPool = new Date();

    this.comandaActiva = { id: 0, mesaId: this.mesaActiva.id, detalles: [] };

    this.comandaService.abrirComanda(this.mesaActiva.id).subscribe({
      next: (nueva) => {
        this.comandaActiva = nueva; 
      },
      error: () => {
        alert("Error al abrir mesa");
        this.cargarMesas(); 
      }
    });
  }

  abrirVentaRapida() {
    this.esVentaRapida = true;
    this.mostrandoPago = false;
    this.mesaActiva = { id: 0, numero: 0, sector: 'Barra', estado: 'Ocupada', esPool: false };
    this.comandaActiva = { mesaId: 0, detalles: [] };
    this.panelAbierto = true;
  }

  agregarAlTicket() {
    if (!this.comandaActiva || this.productoSeleccionadoId === 0) return;

    if (this.esVentaRapida) {
      // (Lógica de venta rápida queda igual)
      const prod = this.productosMenu.find(p => p.id == this.productoSeleccionadoId);
      this.comandaActiva.detalles.push({
        productoId: this.productoSeleccionadoId,
        producto: prod,
        cantidad: this.cantidadSeleccionada,
        precioUnitario: prod?.precio || 0,
        subtotal: this.cantidadSeleccionada * (prod?.precio || 0)
      });
      this.resetearFormularioBuscador();
    } else {
      // --- MODO SALÓN ---
      const prod = this.productosMenu.find(p => p.id == this.productoSeleccionadoId);

      // 1. Creamos el objeto temporal (SIN ID)
      const nuevoDetalle = {
        id: 0, // ID temporal
        productoId: this.productoSeleccionadoId,
        producto: prod,
        cantidad: this.cantidadSeleccionada,
        precioUnitario: prod?.precio || 0,
        subtotal: this.cantidadSeleccionada * (prod?.precio || 0)
      };

      this.comandaActiva.detalles.push(nuevoDetalle);

      // 2. Llamamos al servidor
      this.comandaService.agregarProducto(this.comandaActiva.id, this.productoSeleccionadoId, this.cantidadSeleccionada).subscribe({
        next: (detalleReal) => {
          // IMPORTANTE: El servidor nos devuelve el detalle con su ID real (ej: 512)
          // Lo asignamos al objeto que ya tenemos en pantalla
          nuevoDetalle.id = detalleReal.id;
          console.log("ID sincronizado desde el servidor:", nuevoDetalle.id);
        },
        error: () => {
          alert("Error al guardar producto");
          this.abrirPanel(this.mesaActiva); // Recargamos para limpiar el temporal si falló
        }
      });

      this.resetearFormularioBuscador();
    }
  }

  resetearFormularioBuscador() {
    this.productoSeleccionadoId = 0;
    this.cantidadSeleccionada = 1;
    this.textoBusqueda = '';
  }

  sumarCantidad(item: any) {
    if (this.esVentaRapida) {
      item.cantidad++;
      item.subtotal = item.cantidad * item.precioUnitario;
    } else {
      item.cantidad++;
      item.subtotal = item.cantidad * item.precioUnitario;

      this.comandaService.agregarProducto(this.comandaActiva.id, item.productoId, 1).subscribe({
        error: () => this.abrirPanel(this.mesaActiva) 
      });
    }
  }

  restarCantidad(item: any) {
    if (item.cantidad <= 1) return;

    if (this.esVentaRapida) {
      item.cantidad--;
      item.subtotal = item.cantidad * item.precioUnitario;
    } else {
      item.cantidad--;
      item.subtotal = item.cantidad * item.precioUnitario;

      this.comandaService.agregarProducto(this.comandaActiva.id, item.productoId, -1).subscribe({
        error: () => this.abrirPanel(this.mesaActiva)
      });
    }
  }

  eliminarDelTicket(item: any) {
    console.log("Intentando eliminar ítem:", item); // Mirá la consola para ver si tiene ID

    // 1. Borramos de la vista inmediatamente (UI Optimista)
    this.comandaActiva.detalles = this.comandaActiva.detalles.filter((d: any) => d !== item);

    // 2. Si es Venta Rápida, no hacemos nada más (ya se borró de la lista local)
    if (this.esVentaRapida) return;

    // 3. Si es Salón, mandamos el DELETE al servidor
    // Usamos el ID del detalle (item.id)
    if (item.id && item.id !== 0) {
      this.comandaService.eliminarDetalle(item.id).subscribe({
        next: () => console.log("✅ Petición DELETE exitosa"),
        error: (err) => {
          console.error("❌ Falló el DELETE en el servidor:", err);
          // Si falló, refrescamos el panel para que el producto vuelva a aparecer
          this.abrirPanel(this.mesaActiva);
          alert("No se pudo eliminar el producto del servidor.");
        }
      });
    } else {
      console.warn("⚠️ No se envió DELETE porque el ítem no tiene ID real aún.");
      // Si el ítem es muy nuevo y no tiene ID, lo mejor es recargar el panel
      this.abrirPanel(this.mesaActiva);
    }
  }

  // ==========================================
  // COBRO
  // ==========================================

  iniciarCobro() {
    this.mostrandoPago = true;
    this.metodoPagoSeleccionado = 'Efectivo';
    this.montoEntregado = this.totalComandaActual;
  }

  confirmarCobroDefinitivo() {
    if (this.esVentaRapida) {
      // Lógica de venta rápida (esta no falla porque siempre es local)
      const detalles = this.comandaActiva.detalles.map((d: any) => ({ productoId: d.productoId, cantidad: d.cantidad }));
      this.comandaService.cobrarVentaRapida(detalles, this.metodoPagoSeleccionado).subscribe({
        next: (res) => {
          alert(`✅ Cobrado: $${res.total}`);
          this.cerrarPanel();
        }
      });
    } else {
      // MODO SALÓN: Para evitar el error de la foto, vamos a refrescar la comanda una última vez
      // o confiar en que el eliminarDelTicket funcionó.
      this.comandaService.cerrarComanda(this.comandaActiva.id, this.metodoPagoSeleccionado).subscribe({
        next: (res) => {
          // Si el total que devuelve el server es muy distinto al que veías, te aviso
          if (Math.abs(res.total - this.totalComandaActual) > 1) {
            console.warn("Diferencia de total detectada entre Front y Back");
          }
          alert(`✅ Cobrado: $${res.total}`);
          this.mesaActiva.estado = 'Libre';
          this.mesaActiva.horaInicioPool = undefined;
          this.cerrarPanel();
          this.cargarMesas();
        },
        error: () => alert("Error al procesar el pago. Verificá la conexión.")
      });
    }
  }

  // ==========================================
  // UTILIDADES POOL
  // ==========================================

  tiempoPoolFormat(inicio: any): string {
    const diff = Math.floor((new Date().getTime() - new Date(inicio).getTime()) / 1000);
    if (diff < 0) return '00:00:00';
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    const p = (n: number) => n < 10 ? '0' + n : n;
    return `${p(h)}:${p(m)}:${p(s)}`;
  }

  calcularCostoPoolEnVivo(inicio: any): number {
    const min = (new Date().getTime() - new Date(inicio).getTime()) / 60000;
    return Math.ceil(min / 30) * 6000;
  }
}
