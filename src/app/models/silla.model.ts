export interface SillaModel {
  id: string;
  eventoID: string;
  mesaID?: string;
  precio: number; 
  estado: 'disponible' | 'ocupada' | 'reservada';
}
