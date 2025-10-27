export interface ManteleriaModel {
  id: string;
  eventoID: string;
  mesaID: string;
  tipo: string;
  precio: number; 
  estado: 'disponible' | 'usado' | 'reservado';
}
