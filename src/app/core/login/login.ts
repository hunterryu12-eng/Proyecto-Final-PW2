import { Component, inject } from '@angular/core';
import { PasswordModule } from 'primeng/password';
import { FormsModule } from '@angular/forms';
import { IftaLabelModule } from 'primeng/iftalabel';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/authService';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [FormsModule, PasswordModule, IftaLabelModule, ButtonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  standalone: true,
})
export class Login {
  authService = inject(AuthService);
  router = inject(Router);

  email: string = '';
  password: string = '';

  async onLogear() {
    try {
      const user = await firstValueFrom(this.authService.login(this.email, this.password));

      if (!user) {
        alert('Usuario no encontrado');
        return;
      }

      
      const userData = await this.authService.getUserData(user.uid);

      if (!userData) {
        alert('No se encontraron datos del usuario');
        return;
      }

      
      if (userData.estado === 'inactivo') {
        alert('Tu cuenta está inactiva. Contacta con un administrador.');
        return;
      }

     
      switch (userData.rol) {
        case 'admin':
          this.router.navigate(['/admin']);
          break;
        case 'agente':
          this.router.navigate(['/agentes']);
          break;
        case 'cliente':
          this.router.navigate(['/publicidad']);
          break;
        default:
          alert('Rol no definido');
          break;
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        alert('Email o contraseña incorrecta');
      } else {
        alert(error.message || 'Error al iniciar sesión');
      }
    }
  }

  registrar() {
    this.router.navigate(['/registrar']);
  }
}
