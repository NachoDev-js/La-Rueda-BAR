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

  // =================
  // GESTIÓN DE MESAS 
  // =================

  cargarMesas() {
    this.loading = true;
    this.mesaService.getMesas().subscribe({
      next: (data) => {
        this.mesasInterior = data.filter(m => m.sector === 'Interior');
        this.mesasExterior = data.filter(m => m.sector === 'Exterior');
        this.ordenarListasLocales();

        // Si el componente se reinició, recuperamos cuál era la mesa abierta
        const idGuardado = localStorage.getItem('ultimaMesaId');
        if (idGuardado) {
          const mesaEncontrada = data.find(m => m.id === Number(idGuardado));
          if (mesaEncontrada) {
            // Re-asignamos la mesa activa 
            this.mesaActiva = mesaEncontrada;
            this.panelAbierto = true;
            // Si la mesa está ocupada, cargamos su comanda también
            if (this.mesaActiva.estado === 'Ocupada') {
              this.comandaService.getComandaActiva(this.mesaActiva.id).subscribe(c => this.comandaActiva = c);
            }
          }
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => { console.error(err); this.loading = false; }
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

    // Usamos || 0 por si alguna mesa vieja tiene el campo orden como undefined
    const maxOrden = todas.length > 0 ? Math.max(...todas.map(m => m.orden || 0)) : 0;
    this.nuevaMesa.orden = maxOrden + 1;

    const temp = { ...this.nuevaMesa, id: 0, orden: this.nuevaMesa.orden };

    if (this.nuevaMesa.sector === 'Interior') {
      this.mesasInterior.push(temp);
    } else {
      this.mesasExterior.push(temp);
    }

    this.mesaService.crearMesa(this.nuevaMesa as Mesa).subscribe({
      next: () => {
        this.cargarMesas();
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
    // Si se soltó en el mismo lugar, no hacemos nada
    if (event.previousContainer === event.container) return;

    const mesaArrastrada = event.item.data;
    const mesaDestino = event.container.data;

    if (mesaArrastrada && mesaDestino) {
   
      const ordenAux = mesaArrastrada.orden;
      mesaArrastrada.orden = mesaDestino.orden;
      mesaDestino.orden = ordenAux;

      // Si movés una del Interior al lugar de una del Exterior, ahora la arrastrada es Exterior
      const sectorAux = mesaArrastrada.sector;
      mesaArrastrada.sector = mesaDestino.sector;
      mesaDestino.sector = sectorAux;

      this.mesaService.actualizarMesa(mesaArrastrada).subscribe({
        next: () => console.log(`${mesaArrastrada.numero} ahora es ${mesaArrastrada.sector}`),
        error: () => this.cargarMesas()
      });

      this.mesaService.actualizarMesa(mesaDestino).subscribe({
        next: () => console.log(`${mesaDestino.numero} ahora es ${mesaDestino.sector}`),
        error: () => this.cargarMesas()
      });

      this.sincronizarArraysLocales();
    }
  }

  sincronizarArraysLocales() {
    const todas = [...this.mesasInterior, ...this.mesasExterior];

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

  // ==================
  // COMANDAS Y TICKETS
  // ==================

  abrirPanel(mesa: any) {
    this.mesaActiva = mesa;
    this.panelAbierto = true;

    // GUARDAMOS: Así el sistema recuerda qué mesa estábamos viendo
    localStorage.setItem('ultimaMesaId', mesa.id.toString());

    if (mesa.id !== 0 && mesa.estado === 'Ocupada') {
      this.comandaService.getComandaActiva(mesa.id).subscribe(c => this.comandaActiva = c);
    }
  }

  cerrarPanel() {
    this.panelAbierto = false;
    this.mesaActiva = null;
    // BORRAMOS: Para que no se abra solo la próxima vez que entremos
    localStorage.removeItem('ultimaMesaId');
  }

  abrirCuenta() {
    if (!this.mesaActiva) return;

    this.comandaService.abrirComanda(this.mesaActiva.id).subscribe({
      next: (nueva) => {
        this.comandaActiva = nueva;
        this.cargarMesas();
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
        id: 0, 
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
          nuevoDetalle.id = detalleReal.id;
          console.log("ID sincronizado desde el servidor:", nuevoDetalle.id);
        },
        error: () => {
          alert("Error al guardar producto");
          this.abrirPanel(this.mesaActiva); 
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
    console.log("Intentando eliminar ítem:", item); 

    this.comandaActiva.detalles = this.comandaActiva.detalles.filter((d: any) => d !== item);

    if (this.esVentaRapida) return;

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
      this.abrirPanel(this.mesaActiva);
    }
  }

  // =====
  // COBRO
  // =====

  iniciarCobro() {
    this.mostrandoPago = true;
    this.metodoPagoSeleccionado = 'Efectivo';
    this.montoEntregado = this.totalComandaActual;
  }

  confirmarCobroDefinitivo() {
    if (this.esVentaRapida) {
      const detalles = this.comandaActiva.detalles.map((d: any) => ({ productoId: d.productoId, cantidad: d.cantidad }));
      this.comandaService.cobrarVentaRapida(detalles, this.metodoPagoSeleccionado).subscribe({
        next: (res) => {
          alert(`✅ Cobrado: $${res.total}`);
          this.cerrarPanel();
        }
      });
    } else {
      this.comandaService.cerrarComanda(this.comandaActiva.id, this.metodoPagoSeleccionado).subscribe({
        next: (res) => {
          // Si el total que devuelve el server es muy distinto al que veías, te avisa
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

  // ===============
  // UTILIDADES POOL
  // ===============

  parsearFechaPool(inicio: any): Date | null {
    if (!inicio) return null;

    // Si Angular le asignó un new Date() local al abrir la mesa recién
    if (inicio instanceof Date) return inicio;

    let fechaStr = String(inicio);

    // Si viene de C# con la "T" 
    if (fechaStr.includes('T')) {
      let partes = fechaStr.split('.'); 
      let fechaLimpia = partes[0];
      if (!fechaLimpia.endsWith('Z')) {
        fechaLimpia += 'Z'; 
      }
      return new Date(fechaLimpia);
    }

    // Fallback por si llega otra cosa
    const fechaFallback = new Date(fechaStr);
    return isNaN(fechaFallback.getTime()) ? null : fechaFallback;
  }

  tiempoPoolFormat(inicio: any): string {
    const fechaInicio = this.parsearFechaPool(inicio);
    if (!fechaInicio) return '00:00:00';

    let diff = Math.floor((new Date().getTime() - fechaInicio.getTime()) / 1000);
    if (diff < 0) diff = 0; // Evita cronómetros negativos

    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    const p = (n: number) => n < 10 ? '0' + n : n;
    return `${p(h)}:${p(m)}:${p(s)}`;
  }

  calcularCostoPoolEnVivo(inicio: any): number {
    const fechaInicio = this.parsearFechaPool(inicio);
    if (!fechaInicio) return 0;

    const diffMs = new Date().getTime() - fechaInicio.getTime();
    if (diffMs <= 0) return 0; 

    const min = diffMs / 60000;
    return Math.ceil(min / 30) * 6000;
  }
}
