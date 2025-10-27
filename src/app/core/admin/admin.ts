import { Component, inject, signal, effect } from '@angular/core';
import { Firestore, collectionData, collection, doc, addDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { UsuarioModel } from '../../models/usuario.model';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface SalonModel {
  id?: string;
  nombre: string;
  capacidad: number;
  precioBase: number;
  ubicacion: { lat: number; lng: number } | null;
  estado: 'disponible' | 'reservado';
}

interface EventoModel {
  id: string;
  salonID: string;
  tipo: string;
  fecha: Date;
  capacidad: number;
  estado: string;
  descripcion?: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ButtonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css'],
})
export class Admin {
  firestore = inject(Firestore);

  usuarios = signal<UsuarioModel[]>([]);
  mostrarFormSalon = signal(false);
  salones = signal<SalonModel[]>([]);
  nuevoSalon = signal<SalonModel>({
    nombre: '',
    capacidad: 0,
    precioBase: 0,
    ubicacion: null,
    estado: 'disponible',
  });

  eventos = signal<EventoModel[]>([]);

  private map!: any;
  private marker!: any;
  private L: any;

  constructor() {
    this.getUsuarios();
    this.getSalones();
    this.getEventos();

    effect(() => {
      if (this.mostrarFormSalon()) {
        setTimeout(() => this.initMap(), 300);
      }
    });
  }

  getUsuarios() {
    const usuariosCollection = collection(this.firestore, 'usuarios');
    collectionData(usuariosCollection, { idField: 'id' }).subscribe((data: any) => {
      const sorted = data.sort((a: UsuarioModel, b: UsuarioModel) => {
        const ordenRol = { admin: 1, agente: 2, cliente: 3 };
        return (ordenRol[a.rol] || 4) - (ordenRol[b.rol] || 4);
      });
      this.usuarios.set(sorted);
    });
  }

  toggleEstado(usuario: UsuarioModel) {
    const usuarioDoc = doc(this.firestore, `usuarios/${usuario.id}`);
    const nuevoEstado: 'activo' | 'inactivo' = usuario.estado === 'activo' ? 'inactivo' : 'activo';
    updateDoc(usuarioDoc, { estado: nuevoEstado })
      .then(() => {
        const updated = this.usuarios().map(u =>
          u.id === usuario.id ? { ...u, estado: nuevoEstado } : u
        );
        this.usuarios.set(updated);
      })
      .catch(err => console.error('Error al actualizar estado:', err));
  }

  getSalones() {
    const salonesCollection = collection(this.firestore, 'salones');
    collectionData(salonesCollection, { idField: 'id' }).subscribe((data: any) => {
      this.salones.set(data);
      setTimeout(() => this.initSalonMaps(), 100);
    });
  }

  crearSalon() {
    const salon = this.nuevoSalon();
    if (!salon.nombre || !salon.capacidad || !salon.precioBase || !salon.ubicacion) {
      alert('Completa todos los campos y selecciona una ubicación en el mapa.');
      return;
    }

    if (salon.id) {
      const salonDoc = doc(this.firestore, `salones/${salon.id}`);
      updateDoc(salonDoc, {
        nombre: salon.nombre,
        capacidad: salon.capacidad,
        precioBase: salon.precioBase,
        estado: salon.estado,
        ubicacion: salon.ubicacion || undefined
      }).then(() => {
        this.resetSalonModal();
      });

    } else {
      const salonesCollection = collection(this.firestore, 'salones');
      addDoc(salonesCollection, salon).then(() => this.resetSalonModal());
    }
  }

  editarSalon(salon: SalonModel) {
    this.nuevoSalon.set({ ...salon });
    this.mostrarFormSalon.set(true);
  }

  eliminarSalon(salon: SalonModel) {
    if (!salon.id) return;
    if (!confirm(`¿Eliminar salón ${salon.nombre}? Esto también puede afectar eventos asociados.`)) return;
    deleteDoc(doc(this.firestore, `salones/${salon.id}`)).then(() => this.getSalones());
  }

  cerrarModal() {
    this.mostrarFormSalon.set(false);
  }

  private resetSalonModal() {
    this.nuevoSalon.set({ nombre:'', capacidad:0, precioBase:0, ubicacion:null, estado:'disponible' });
    this.mostrarFormSalon.set(false);
    this.getSalones();
  }

  async initMap() {
    if (typeof window === 'undefined') return;

    this.L = (await import('leaflet')).default;

    if (this.map) this.map.remove();
    this.map = this.L.map('map').setView([-17.7833, -63.1821], 16);

    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    const iconoMarcador = this.L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    const ubicacion = this.nuevoSalon().ubicacion;
    if (ubicacion) {
      this.marker = this.L.marker([ubicacion.lat, ubicacion.lng], { icon: iconoMarcador }).addTo(this.map);
      this.map.setView([ubicacion.lat, ubicacion.lng], 16);
    }

    this.map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      this.nuevoSalon.update(s => ({ ...s, ubicacion: { lat, lng } }));
      if (this.marker) this.marker.setLatLng([lat, lng]);
      else this.marker = this.L.marker([lat, lng], { icon: iconoMarcador }).addTo(this.map);
    });
  }

  async initSalonMaps() {
    if (typeof window === 'undefined') return;
    const L = (await import('leaflet')).default;

    const iconoMarcador = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    this.salones().forEach(salon => {
      if (!salon.ubicacion) return;
      const id = `map-salon-${salon.id}`;
      const el = document.getElementById(id);
      if (!el) return;
      if ((el as any)._leafletMap) return;

      const map = L.map(id).setView([salon.ubicacion.lat, salon.ubicacion.lng], 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      L.marker([salon.ubicacion.lat, salon.ubicacion.lng], { icon: iconoMarcador }).addTo(map);
      (el as any)._leafletMap = map;
    });
  }

  getEventos() {
    const eventosCollection = collection(this.firestore, 'eventos');
    collectionData(eventosCollection, { idField: 'id' }).subscribe((data: any[]) => {
      this.eventos.set(
        data.map(e => ({
          id: e.id,
          salonID: e.salonID,
          tipo: e.tipo,
          fecha: e.fecha?.toDate ? e.fecha.toDate() : new Date(e.fecha),
          capacidad: e.capacidad,
          estado: e.estado,
          descripcion: e.descripcion ?? ''
        }))
      );

      setTimeout(() => this.initEventoMaps(), 100);
    });
  }

  async initEventoMaps() {
    if (typeof window === 'undefined') return;
    const L = (await import('leaflet')).default;

    const iconoMarcador = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    this.eventos().forEach(evento => {
      const salon = this.getSalonDeEvento(evento.salonID);
      if (!salon?.ubicacion) return;

      const mapContainerId = `map-evento-${evento.id}`;
      const mapContainer = document.getElementById(mapContainerId);
      if (!mapContainer || (mapContainer as any)._leafletMap) return;

      const map = L.map(mapContainerId).setView([salon.ubicacion.lat, salon.ubicacion.lng], 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
      L.marker([salon.ubicacion.lat, salon.ubicacion.lng], { icon: iconoMarcador }).addTo(map);
      (mapContainer as any)._leafletMap = map;
    });
  }

  getSalonDeEvento(salonID: string) {
    return this.salones().find(s => s.id === salonID);
  }
}
