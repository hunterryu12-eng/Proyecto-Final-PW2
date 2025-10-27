import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PasswordModule } from 'primeng/password';
import { IftaLabelModule } from 'primeng/iftalabel';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/authService';
import { Router } from '@angular/router';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.html',
  styleUrls: ['./registro.css'],
  standalone: true,
  imports: [FormsModule, PasswordModule, IftaLabelModule, ButtonModule],
})
export class Registro {
  authService = inject(AuthService);
  firestore = inject(Firestore);
  router = inject(Router);

  email: string = '';
  password: string = '';
  rol: 'cliente' | 'agente' | 'admin' | '' = '';

  async onRegistrar() {
  if (!this.email || !this.password || !this.rol) {
    alert('Completa todos los campos');
    return;
  }

  try {
    const user = await this.authService.register(this.email, this.password);

    console.log('Usuario Auth creado:', user.uid);


    await setDoc(doc(this.firestore, `usuarios/${user.uid}`), {
      id: user.uid,
      email: this.email,
      rol: this.rol,
      estado: 'activo',
    });

    console.log('Documento Firestore creado correctamente');

    this.router.navigate(['/login']);
  } catch (error: any) {
    console.error('Error al registrar usuario:', error);
    alert(error.message || 'Error al registrar usuario');
  }
}


  iniciar() {
    this.router.navigate(['/login']);
  }
}
