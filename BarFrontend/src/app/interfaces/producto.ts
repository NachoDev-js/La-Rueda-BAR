export interface Producto {
  id?: number; // El signo de interrogación significa que es opcional (al crear uno nuevo no tiene ID todavía)
  nombre: string;
  precio: number;
  categoria: string;
}
