export interface EventoModel {
  id: string;
  salonID: string;        
  agenteID: string;      
  tipo: 'Boda' | 'Cumpleaños' | 'Quinceaños' | 'Fiesta Temática';
  descripcion?: string;   
  fecha: Date;
  capacidad: number;
  estado: 'pendiente' | 'en_progreso' | 'finalizado' | 'cancelado';
}
