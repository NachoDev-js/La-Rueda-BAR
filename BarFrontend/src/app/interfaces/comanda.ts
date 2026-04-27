import { DetalleComanda } from './detalle-comanda';

export interface Comanda {
  id?: number;
  mesaId: number;
  fechaHoraApertura: Date;
  fechaHoraCierre?: Date;
  estado: string;
  totalCobrado: number;
  detalles: DetalleComanda[];
}
