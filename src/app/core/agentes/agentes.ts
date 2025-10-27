import { Component, inject, signal } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, updateDoc, doc, deleteDoc, query, where } from '@angular/fire/firestore';
import { EventoModel } from '../../models/evento.model';
import { MesaModel } from '../../models/mesa.model';
import { SillaModel } from '../../models/silla.model';
import { ManteleriaModel } from '../../models/manteleria.model';
import { SalonModel } from '../../models/salon.model';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '../../services/authService';
import { EntradaModel } from '../../models/entrada.model';

@Component({
  selector: 'app-agentes',
  standalone: true,
  imports: [CommonModule, ButtonModule, FormsModule],
  templateUrl: './agentes.html',
  styleUrls: ['./agentes.css'],
})
export class Agentes {
  mostrarModalDevolucion = signal(false);

  totalDaniado = signal(0); 
  damagedMesas = signal<Record<string, boolean>>({});
  damagedSillas = signal<Record<string, boolean>>({});
  damagedMantelerias = signal<Record<string, boolean>>({});

  firestore = inject(Firestore);
  auth = inject(AuthService);
  agenteID = signal<string>(''); 
  entradas = signal<EntradaModel[]>([]);

  eventos = signal<EventoModel[]>([]);
  eventoSeleccionado = signal<EventoModel | null>(null);

  nuevoEvento = signal<EventoModel>({
    id: '',
    salonID: '',
    agenteID: '',
    tipo: 'Boda',
    fecha: new Date(),
    capacidad: 0,
    estado: 'pendiente'
  });

  get nuevoTipo(): "Boda" | "Cumpleaños" | "Quinceaños" | "Fiesta Temática" | '' {
    return this.nuevoEvento().tipo || '';
  }
  set nuevoTipo(value: "Boda" | "Cumpleaños" | "Quinceaños" | "Fiesta Temática") {
    this.nuevoEvento.update(e => ({ ...e, tipo: value }));
  }

  salones = signal<SalonModel[]>([]);

  mesas = signal<MesaModel[]>([]);
  mostrarFormMesa = signal(false);
  nuevaMesa = signal<MesaModel>({ id: '', eventoID: '', numero: 0, capacidad: 0, precio: 50, estado: 'disponible' });

  sillas = signal<SillaModel[]>([]);
  mostrarFormSilla = signal(false);
  nuevaSilla = signal<SillaModel>({ id: '', eventoID: '', mesaID: '', precio: 10, estado: 'disponible' });

  mantelerias = signal<ManteleriaModel[]>([]);
  mostrarFormManteleria = signal(false);
  nuevaManteleria = signal<ManteleriaModel>({ id: '', eventoID: '', mesaID: '', tipo: '', precio: 20, estado: 'disponible' });

  constructor() {
    const user = this.auth.user;
    if (user) {
      this.agenteID.set(user.uid);
      this.nuevoEvento.update(e => ({ ...e, agenteID: user.uid }));
    }
    this.getSalones();
    this.getEventos();
  }

  getSalones() {
    const salonesCollection = collection(this.firestore, 'salones');
    collectionData(salonesCollection, { idField: 'id' }).subscribe((data: any[]) => {
      const salones: SalonModel[] = data.map(s => ({
        id: s.id,
        nombre: s.nombre,
        capacidad: s.capacidad,
        ubicacion: s.ubicacion ?? null,
        precioBase: s.precioBase,
        estado: s.estado
      }));
      this.salones.set(salones);
    });
  }

  getEventos() {
    const eventosCollection = collection(this.firestore, 'eventos');
    const q = query(eventosCollection, where('agenteID', '==', this.agenteID()));
    collectionData(q, { idField: 'id' }).subscribe((data: any[]) => {
      const eventos: EventoModel[] = data.map(doc => ({
        id: doc.id,
        salonID: doc.salonID,
        agenteID: doc.agenteID,
        tipo: doc.tipo,
        fecha: doc.fecha instanceof Timestamp ? doc.fecha.toDate() : new Date(doc.fecha),
        capacidad: doc.capacidad,
        estado: doc.estado,
        descripcion: doc.descripcion ?? ''
      }));
      this.eventos.set(eventos);
    });
  }

  async crearEvento() {
    const salonID = this.nuevoEvento().salonID;
    const fecha = this.nuevoEvento().fecha;

    const eventoDuplicado = this.eventos().some(ev =>
      ev.salonID === salonID &&
      ev.fecha.toDateString() === fecha.toDateString() &&
      ev.agenteID === this.agenteID()
    );

    if (eventoDuplicado) {
      alert('Ya tienes un evento en este salón y fecha.');
      return;
    }

    const eventoAGuardar: EventoModel = { ...this.nuevoEvento(), id: uuidv4(), agenteID: this.agenteID() };
    await addDoc(collection(this.firestore, 'eventos'), eventoAGuardar);
    this.resetNuevoEvento();
    this.getEventos();
  }

  editarEvento(evento: EventoModel) {
    this.nuevoEvento.set({ ...evento });
    this.eventoSeleccionado.set(evento);
  }

  async guardarEventoEditado() {
    if (!this.nuevoEvento().id) return;
    const eventoDoc = doc(this.firestore, `eventos/${this.nuevoEvento().id}`);
    await updateDoc(eventoDoc, {
      tipo: this.nuevoEvento().tipo,
      fecha: this.nuevoEvento().fecha,
      capacidad: this.nuevoEvento().capacidad,
      salonID: this.nuevoEvento().salonID,
      estado: this.nuevoEvento().estado
    });
    this.resetNuevoEvento();
    this.getEventos();
  }

  async eliminarEvento(evento: EventoModel) {
    if (!confirm('¿Seguro que quieres eliminar este evento?')) return;
    await deleteDoc(doc(this.firestore, `eventos/${evento.id}`));
    this.eventoSeleccionado.set(null);
    this.getEventos();
  }

  seleccionarEvento(evento: EventoModel) {
    this.eventoSeleccionado.set(evento);
    const id = evento.id; 
    console.log('Evento seleccionado ID:', id);  
    this.getMesas(id);
    this.getSillas(id);
    this.getMantelerias(id);
    this.getEntradas(id);
  }


  private resetNuevoEvento() {
    this.nuevoEvento.set({
      id: '',
      salonID: '',
      agenteID: this.agenteID(),
      tipo: 'Boda',
      fecha: new Date(),
      capacidad: 0,
      estado: 'pendiente'
    });
  }

  getNombreSalon(salonID: string) { 
    const salon = this.salones().find(s => s.id === salonID); 
    return salon ? salon.nombre : 'Sin asignar'; 
  }
  getNombreMesa(mesaID: string) { 
    const mesa = this.mesas().find(m => m.id === mesaID); 
    return mesa ? `Mesa ${mesa.numero}` : 'Sin asignar'; 
  }

  getMesas(eventoID: string) {
    const mesasCollection = collection(this.firestore, 'mesas');
    collectionData(mesasCollection, { idField: 'id' }).subscribe((data: any[]) => {
      const mesasFiltradas = data.filter(m => m.eventoID === eventoID).sort((a,b)=>a.numero - b.numero);
      this.mesas.set(mesasFiltradas);
    });
  }

  guardarMesa() {
    const eventoID = this.eventoSeleccionado()?.id || '';
    if (!eventoID) return;

    let numeroMesa = this.nuevaMesa().numero;
    if (!this.nuevaMesa().id) {
      const maxNumero = this.mesas().reduce((max, m) => m.numero > max ? m.numero : max, 0);
      numeroMesa = maxNumero + 1;
    }

    const mesaAGuardar: MesaModel = { 
      ...this.nuevaMesa(), 
      id: this.nuevaMesa().id || uuidv4(), 
      eventoID,
      numero: numeroMesa
    };

    if (this.nuevaMesa().id) {
      updateDoc(doc(this.firestore, `mesas/${mesaAGuardar.id}`), { ...mesaAGuardar }).then(() => {
        this.mesas.update(ms => ms.map(m => m.id === mesaAGuardar.id ? mesaAGuardar : m));
        this.resetMesa();
      });
    } else {
      addDoc(collection(this.firestore, 'mesas'), mesaAGuardar).then(() => {
        this.mesas.update(ms => [...ms, mesaAGuardar].sort((a,b)=>a.numero-b.numero));
        this.resetMesa();
      });
    }
  }

  editarMesa(mesa:MesaModel){ this.nuevaMesa.set({...mesa}); this.mostrarFormMesa.set(true);}
  eliminarMesa(mesa:MesaModel){ deleteDoc(doc(this.firestore, `mesas/${mesa.id}`)).then(()=>this.mesas.update(ms=>ms.filter(m=>m.id!==mesa.id))); }
  private resetMesa(){ this.nuevaMesa.set({id:'', eventoID:'', numero:0, capacidad:0, precio:50, estado:'disponible'}); this.mostrarFormMesa.set(false); }

  getSillas(eventoID:string){
    const sillasCollection = collection(this.firestore, 'sillas');
    collectionData(sillasCollection, { idField: 'id' }).subscribe((data:any[])=>{
      const sillasFiltradas = data.filter(s=>s.eventoID===eventoID);
      this.sillas.set(sillasFiltradas);
    });
  }

  guardarSilla() {
    const sillaAGuardar:SillaModel = { ...this.nuevaSilla(), id:this.nuevaSilla().id||uuidv4(), eventoID:this.eventoSeleccionado()?.id||'' };
    if(this.nuevaSilla().id){ 
      updateDoc(doc(this.firestore, `sillas/${sillaAGuardar.id}`), {...sillaAGuardar}).then(()=> {
        this.sillas.update(ss => ss.map(s => s.id===sillaAGuardar.id ? sillaAGuardar : s));
        this.resetSilla();
      });
    } else { 
      addDoc(collection(this.firestore,'sillas'), sillaAGuardar).then(()=> {
        this.sillas.update(ss => [...ss, sillaAGuardar]);
        this.resetSilla();
      });
    }
  }
  editarSilla(silla:SillaModel){ this.nuevaSilla.set({...silla}); this.mostrarFormSilla.set(true);}
  eliminarSilla(silla:SillaModel){ deleteDoc(doc(this.firestore, `sillas/${silla.id}`)).then(()=> this.sillas.update(ss => ss.filter(s=>s.id!==silla.id))); }
  private resetSilla(){ this.nuevaSilla.set({id:'', eventoID:'', mesaID:'', precio:10, estado:'disponible'}); this.mostrarFormSilla.set(false); }

  getMantelerias(eventoID:string){
    const manteleriasCollection = collection(this.firestore, 'manteleria');
    collectionData(manteleriasCollection, { idField:'id' }).subscribe((data:any[])=>{
      const filtradas = data.filter(m=>m.eventoID===eventoID);
      this.mantelerias.set(filtradas);
    });
  }

  guardarManteleria() {
    const manteleriaAGuardar:ManteleriaModel = { ...this.nuevaManteleria(), id:this.nuevaManteleria().id||uuidv4(), eventoID:this.eventoSeleccionado()?.id||'' };
    if(this.nuevaManteleria().id){
      updateDoc(doc(this.firestore, `manteleria/${manteleriaAGuardar.id}`), {...manteleriaAGuardar}).then(() => {
        this.mantelerias.update(ms => ms.map(m=>m.id===manteleriaAGuardar.id ? manteleriaAGuardar : m));
        this.resetManteleria();
      });
    } else {
      addDoc(collection(this.firestore,'manteleria'), manteleriaAGuardar).then(() => {
        this.mantelerias.update(ms => [...ms, manteleriaAGuardar]);
        this.resetManteleria();
      });
    }
  }

  editarManteleria(m:ManteleriaModel){ this.nuevaManteleria.set({...m}); this.mostrarFormManteleria.set(true);}
  eliminarManteleria(m:ManteleriaModel){ deleteDoc(doc(this.firestore, `manteleria/${m.id}`)).then(()=>this.mantelerias.update(ms=>ms.filter(x=>x.id!==m.id))); }
  private resetManteleria(){ this.nuevaManteleria.set({id:'', eventoID:'', mesaID:'', tipo:'', precio:20, estado:'disponible'}); this.mostrarFormManteleria.set(false); }

marcarDaniado(tipo: 'mesa' | 'silla' | 'manteleria', item: any) {
  const precio = item.precio || 0;
  switch(tipo) {
    case 'mesa':
      if (!this.damagedMesas()[item.id]) {
        this.totalDaniado.update(t => t + precio);
        this.damagedMesas.update(dm => ({ ...dm, [item.id]: true }));
      }
      break;
    case 'silla':
      if (!this.damagedSillas()[item.id]) {
        this.totalDaniado.update(t => t + precio);
        this.damagedSillas.update(ds => ({ ...ds, [item.id]: true }));
      }
      break;
    case 'manteleria':
      if (!this.damagedMantelerias()[item.id]) {
        this.totalDaniado.update(t => t + precio);
        this.damagedMantelerias.update(dm => ({ ...dm, [item.id]: true }));
      }
      break;
  }
}

quitarDaniado(tipo: 'mesa' | 'silla' | 'manteleria', item: any) {
  const precio = item.precio || 0;
  switch(tipo) {
    case 'mesa':
      if (this.damagedMesas()[item.id]) {
        this.totalDaniado.update(t => t - precio);
        this.damagedMesas.update(dm => ({ ...dm, [item.id]: false }));
      }
      break;
    case 'silla':
      if (this.damagedSillas()[item.id]) {
        this.totalDaniado.update(t => t - precio);
        this.damagedSillas.update(ds => ({ ...ds, [item.id]: false }));
      }
      break;
    case 'manteleria':
      if (this.damagedMantelerias()[item.id]) {
        this.totalDaniado.update(t => t - precio);
        this.damagedMantelerias.update(dm => ({ ...dm, [item.id]: false }));
      }
      break;
  }
}

async enviarReporteDaniado() {
  const eventoID = this.eventoSeleccionado()?.id;
  if (!eventoID) return;

  alert(`La deuda a cobrar es de $${this.totalDaniado()}`);


  await deleteDoc(doc(this.firestore, `eventos/${eventoID}`));


  this.eventoSeleccionado.set(null);
  this.mostrarModalDevolucion.set(false);
  this.totalDaniado.set(0);
  this.damagedMesas.set({});
  this.damagedSillas.set({});
  this.damagedMantelerias.set({});
  this.getEventos();
}

  getEntradas(eventoID: string) {
    const entradasCollection = collection(this.firestore, 'entradas');
    const q = query(entradasCollection, where('eventoID', '==', eventoID));

    collectionData(q, { idField: 'id' }).subscribe((data: any[]) => {
      const entradas: EntradaModel[] = data.map(e => {
        let fecha: Date;
        
        if (e.fechaCompra?.seconds !== undefined) {
          fecha = new Date(e.fechaCompra.seconds * 1000);
        } 
        else {
          fecha = new Date(e.fechaCompra);
        }

        return {
          id: e.id,
          eventoID: e.eventoID,
          clienteID: e.clienteID,
          fechaCompra: fecha,
          precio: e.precio,
        };
      });

      this.entradas.set(entradas);
    });
  }
  async confirmarEntrada(entrada: EntradaModel) {
    if (!confirm('¿Confirmar esta entrada y eliminarla de la lista?')) return;

    try {
      await deleteDoc(doc(this.firestore, `entradas/${entrada.id}`));

      this.entradas.update(entradas => entradas.filter(e => e.id !== entrada.id));

      alert('Entrada confirmada correctamente.');
    } catch (error) {
      console.error('Error al confirmar entrada:', error);
      alert('Ocurrió un error al confirmar la entrada.');
    }
  }



}
