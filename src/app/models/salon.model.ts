export interface SalonModel {
  id: string;
  nombre: string;
  capacidad: number;
  ubicacion: {
    lat: number;
    lng: number;
  };
  precioBase: number;
  estado: 'disponible' | 'mantenimiento';
}
