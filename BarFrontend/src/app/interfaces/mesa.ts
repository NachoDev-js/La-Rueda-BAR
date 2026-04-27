export interface Mesa {
  id?: number;
  numero: number;
  estado: string; 
  sector?: string; 
  esPool?: boolean; 
  horaInicioPool?: string | Date | null;
  orden?: number; 
}
