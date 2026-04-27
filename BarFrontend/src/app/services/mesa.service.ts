import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mesa } from '../interfaces/mesa';

@Injectable({
  providedIn: 'root'
})
export class MesaService {
  private http = inject(HttpClient);
  private apiUrl = '/api/mesas';

  getMesas(): Observable<Mesa[]> {
    return this.http.get<Mesa[]>(this.apiUrl);
  }

  crearMesa(mesa: Mesa): Observable<Mesa> {
    return this.http.post<Mesa>(this.apiUrl, mesa);
  }

  eliminarMesa(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  actualizarMesa(mesa: Mesa): Observable<Mesa> {
    return this.http.put<Mesa>(`${this.apiUrl}/${mesa.id}`, mesa);
  }

}
