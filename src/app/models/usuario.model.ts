export interface UsuarioModel {
  id: string;
  nombre: string;
  email: string;
  rol: 'admin' | 'agente' | 'cliente';
  estado: 'activo' | 'inactivo';
}
