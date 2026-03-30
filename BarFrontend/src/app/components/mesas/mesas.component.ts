import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MesaService } from '../../services/mesa.service';
import { Mesa } from '../../interfaces/mesa';

@Component({
  selector: 'app-mesas',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './mesas.component.html',
  styleUrl: './mesas.component.scss'
})
export class MesasComponent implements OnInit {
  private mesaService = inject(MesaService);

  mesas: Mesa[] = [];

  // Inicializamos la mesa por defecto como "Libre"
  nuevaMesa: Mesa = {
    numero: 0,
    estado: 'Libre'
  };

  ngOnInit(): void {
    this.cargarMesas();
  }

  cargarMesas() {
    this.mesaService.getMesas().subscribe({
      next: (data) => this.mesas = data,
      error: (err) => console.error('Error al cargar mesas', err)
    });
  }

  guardar() {
    this.mesaService.crearMesa(this.nuevaMesa).subscribe({
      next: (mesaCreada) => {
        this.mesas.push(mesaCreada);
        this.nuevaMesa = { numero: 0, estado: 'Libre' }; // Limpiamos
      },
      error: (err) => console.error('Error al guardar mesa', err)
    });
  }
}
