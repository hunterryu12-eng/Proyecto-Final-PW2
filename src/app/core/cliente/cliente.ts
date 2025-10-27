import { Component, inject, signal } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, query, where, Timestamp } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { v4 as uuidv4 } from 'uuid';
import { EventoModel } from '../../models/evento.model';
import { EntradaModel } from '../../models/entrada.model';
import { AuthService } from '../../services/authService';

@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [CommonModule, ButtonModule, DialogModule, FormsModule],
  templateUrl: './cliente.html',
  styleUrls: ['./cliente.css'],
})
export class Cliente {
  firestore = inject(Firestore);
  auth = inject(AuthService); 

  eventos = signal<EventoModel[]>([]);
  eventoSeleccionado = signal<EventoModel | null>(null);
  mostrarModalCompra = signal(false);
  mensajeCompra = signal<string | null>(null);
  entradas = signal<EntradaModel[]>([]);

  clienteID: string | null = null;

  constructor() {
    this.initCliente();
    this.getEventos();
  }

  initCliente() {
    this.auth.user$.subscribe((user: any) => {
      if (user) {
        this.clienteID = user.uid;
        this.getEntradasCliente(); 
      } else {
        this.clienteID = null;
        this.entradas.set([]);
      }
    });
  }

getEventos() {
  const eventosCollection = collection(this.firestore, 'eventos');
  collectionData(eventosCollection, { idField: 'id' }).subscribe((data: any[]) => {
    const eventos: EventoModel[] = data
      .map(doc => ({
        id: doc.id,
        salonID: doc.salonID || '',
        agenteID: doc.agenteID || '',
        tipo: doc.tipo,
        fecha: doc.fecha instanceof Timestamp ? doc.fecha.toDate() : new Date(doc.fecha),
        capacidad: doc.capacidad,
        estado: doc.estado || 'pendiente',
      }))
      .filter(evento => evento.tipo?.toLowerCase() !== 'boda');

    this.eventos.set(eventos);
  });
}


  seleccionarEvento(evento: EventoModel) {
    this.eventoSeleccionado.set(evento);
  }

  abrirModalCompra() {
    this.mostrarModalCompra.set(true);
    this.mensajeCompra.set(null);
  }

  async confirmarCompra() {
    const evento = this.eventoSeleccionado();
    if (!evento || !this.clienteID) return;

    const entradasCliente = this.entradas();
    const yaTieneEntrada = entradasCliente.some(e => e.eventoID === evento.id);

    if (yaTieneEntrada) {
      this.mensajeCompra.set('⚠️ Ya tienes una entrada para este evento.');
      this.mostrarModalCompra.set(false);
      return;
    }

    const entrada: EntradaModel = {
      id: uuidv4(),
      eventoID: evento.id,
      clienteID: this.clienteID,
      fechaCompra: new Date(),
      precio: 50,
    };

    const entradasCollection = collection(this.firestore, 'entradas');
    await addDoc(entradasCollection, entrada)
      .then(() => {
        this.mensajeCompra.set('✅ Compra confirmada correctamente.');
        this.mostrarModalCompra.set(false);
        this.getEntradasCliente();
      })
      .catch(err => console.error('Error al guardar entrada:', err));
  }

  getEntradasCliente() {
    if (!this.clienteID) return;

    const entradasCollection = collection(this.firestore, 'entradas');
    const q = query(entradasCollection, where('clienteID', '==', this.clienteID));

    collectionData(q, { idField: 'id' }).subscribe((data: any[]) => {
      const entradasFiltradas: EntradaModel[] = data.map(e => ({
        id: e.id,
        eventoID: e.eventoID,
        clienteID: e.clienteID,
        precio: e.precio || 50,
        fechaCompra: e.fechaCompra instanceof Timestamp
          ? e.fechaCompra.toDate()
          : new Date(e.fechaCompra),
      }));

      this.entradas.set(entradasFiltradas);
    });
  }

  getNombreEvento(eventoID: string): string {
    const evento = this.eventos().find(e => e.id === eventoID);
    return evento ? evento.tipo : 'Evento desconocido';
  }

  getFechaEvento(eventoID: string): Date | null {
    const evento = this.eventos().find(e => e.id === eventoID);
    return evento ? evento.fecha : null;
  }
}
