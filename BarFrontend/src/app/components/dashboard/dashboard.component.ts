import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ComandaService } from '../../services/comanda.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true, 
  imports: [CommonModule, FormsModule ], 
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats: any = { hoy: 0, semana: 0, mes: 0, cantidadVentasHoy: 0 };

  constructor(
    private comandaService: ComandaService,
    private cdr: ChangeDetectorRef 
  ) { }

  fechaSeleccionada: string = '';
  mesSeleccionado: number = new Date().getMonth() + 1;
  anioSeleccionado: number = new Date().getFullYear();
  resultadoFiltro: any = null;
  tituloFiltro: string = '';

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  cargarEstadisticas() {
    this.comandaService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar stats:', err)
    });
  }

  consultarPorDia() {
    if (!this.fechaSeleccionada) return;
    this.comandaService.getStatsCustom(this.fechaSeleccionada, null, null).subscribe(data => {
      this.resultadoFiltro = data;
      this.tituloFiltro = `el día ${this.fechaSeleccionada}`;
      this.cdr.detectChanges();
    });
  }

  consultarPorMes() {
    this.comandaService.getStatsCustom(null, this.mesSeleccionado, this.anioSeleccionado).subscribe(data => {
      this.resultadoFiltro = data;
      const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      this.tituloFiltro = `${nombresMeses[this.mesSeleccionado - 1]} ${this.anioSeleccionado}`;
      this.cdr.detectChanges();
    });
  }
}
