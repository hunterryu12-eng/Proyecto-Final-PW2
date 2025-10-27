export interface MesaModel {
  id: string;
  eventoID: string;
  numero: number;
  capacidad: number;
  precio: number; 
  estado: 'disponible' | 'ocupada' | 'reservada';
}
