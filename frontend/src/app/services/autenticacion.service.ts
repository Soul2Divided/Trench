import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface UsuarioAutenticado {
    id: string;
    nombre: string;
    apellido: string;
    correo: string;
    nombreUsuario: string;
    fechaNacimiento: string;
    descripcion: string;
    imagenPerfilUrl: string;
    perfil: 'usuario' | 'administrador';
}

@Injectable({ providedIn: 'root' })
export class AutenticacionService {
    private readonly http = inject(HttpClient);

    private readonly url = 'http://localhost:3000/autenticacion';

    login(correo: string, contrasena: string): Promise<UsuarioAutenticado> {
        return firstValueFrom(
            this.http.post<UsuarioAutenticado>(`${this.url}/login`, {
                correo,
                contrasena,
            }),
        );
    }

    registrar(datos: FormData): Promise<UsuarioAutenticado> {
        return firstValueFrom(
            this.http.post<UsuarioAutenticado>(`${this.url}/registro`, datos),
        );
    }
}
