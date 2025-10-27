import { Routes } from '@angular/router';
import { Agentes } from './core/agentes/agentes';
import { Login } from './core/login/login';
import { Registro } from './core/registro/registro';
import { Admin } from './core/admin/admin';
import { Cliente } from './core/cliente/cliente';
import { agenteGuard } from './guards/agente.guard';
import { adminGuard } from './guards/admin.guard';
import { clienteGuard } from './guards/cliente.guard';
import { Publicidad } from './core/publicidad/publicidad';
import { publicidadGuard } from './guards/publicidad.guard';

export const routes: Routes = [
    {
        component: Agentes,
        path: 'agentes',
        canActivate: [agenteGuard],
    },
    {
        component: Login,
        path: 'login'
    },
    {
        component: Registro,
        path: 'registrar'
    },
    {
        component: Admin,
        path: 'admin',
        canActivate: [adminGuard]
    },
    {
        component: Cliente,
        path: 'cliente',
        canActivate: [clienteGuard]
    },
    {
        component: Publicidad,
        path: 'publicidad',
        canActivate : [publicidadGuard]
        
    }
];
