import { Component, AfterViewInit, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { Firestore, collectionData, collection } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

interface Salon {
  id: string;
  nombre: string;
  capacidad: number;
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-publicidad',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './publicidad.html',
  styleUrls: ['./publicidad.css'],
})
export class Publicidad implements AfterViewInit {
  firestore = inject(Firestore);
  router = inject(Router);

  salones = signal<Salon[]>([]);
  @ViewChild('carrusel') carrusel!: ElementRef<HTMLDivElement>;

  constructor() {
    this.cargarSalones();
  }

  cargarSalones() {
    const salonesCollection = collection(this.firestore, 'salones');
    collectionData(salonesCollection, { idField: 'id' }).subscribe((data: any[]) => {
      const listaSalones: Salon[] = data.map(s => ({
        id: s.id,
        nombre: s.nombre,
        capacidad: s.capacidad,
        lat: s.lat || -16.5,
        lng: s.lng || -68.1,
      }));
      this.salones.set(listaSalones);

      if (typeof window !== 'undefined') {
        setTimeout(() => this.inicializarMapas(), 0);
      }
    });
  }

  async inicializarMapas() {
    const L = await import('leaflet');
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    this.salones().forEach(salon => {
      const map = L.map('map-' + salon.id, { center: [salon.lat, salon.lng], zoom: 16 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
      L.marker([salon.lat, salon.lng]).addTo(map).bindPopup(salon.nombre).openPopup();
    });
  }

  irCliente() {
    this.router.navigate(['/cliente']);
  }

  moverIzquierda() {
    this.carrusel.nativeElement.scrollBy({ left: -320, behavior: 'smooth' });
  }

  moverDerecha() {
    this.carrusel.nativeElement.scrollBy({ left: 320, behavior: 'smooth' });
  }

  ngAfterViewInit() {}
}
