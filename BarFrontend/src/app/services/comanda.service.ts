import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comanda } from '../interfaces/comanda';

@Injectable({
  providedIn: 'root'
})
export class ComandaService {
  private http = inject(HttpClient);
  private apiUrl = '/api/Comandas';

  getComandaActiva(mesaId: number): Observable<Comanda> {
    return this.http.get<Comanda>(`${this.apiUrl}/mesa/${mesaId}`);
  }

  abrirComanda(mesaId: number): Observable<Comanda> {
    return this.http.post<Comanda>(`${this.apiUrl}/abrir/${mesaId}`, {});
  }

  agregarProducto(comandaId: number, productoId: number, cantidad: number): Observable<any> {
    const request = { productoId, cantidad };
    return this.http.post(`${this.apiUrl}/${comandaId}/agregar`, request);
  }

  cerrarComanda(comandaId: number, metodoPago: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${comandaId}/cerrar?metodoPago=${metodoPago}`, {});
  }

  actualizarCantidadDetalle(detalleId: number, nuevaCantidad: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/detalle/${detalleId}?nuevaCantidad=${nuevaCantidad}`, {});
  }

  eliminarDetalle(detalleId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/detalle/${detalleId}`);
  }

  cobrarVentaRapida(detalles: any[], metodoPago: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/venta-rapida?metodoPago=${metodoPago}`, detalles);
  }

  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }

  getStatsCustom(fecha: string | null, mes: number | null, anio: number | null): Observable<any> {
    let url = `/api/Comandas/stats-custom`;

    if (fecha) {
      url += `?fecha=${fecha}`;
    } else if (mes && anio) {
      url += `?mes=${mes}&anio=${anio}`;
    }

    return this.http.get(url);
  }

}
