import { Producto } from './producto'; 

export interface DetalleComanda {
  id?: number;
  comandaId: number;
  productoId: number;
  producto?: Producto; 
  cantidad: number;
  precioUnitario: number;
  subtotal?: number;
}
