import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment.development';

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

    private readonly url = `${environment.apiUrl}/autenticacion`;
    private readonly claveUsuario = 'trench.usuario';
    private readonly usuario = signal<UsuarioAutenticado | null>(this.recuperarUsuario());

    readonly usuarioActual = this.usuario.asReadonly();

    login(correo: string, contrasena: string): Observable<UsuarioAutenticado> {
        return this.http.post<UsuarioAutenticado>(`${this.url}/login`, {
            correo,
            contrasena,
        })
            //cuando llega el usuario, se actualiza la señal y se guarda en sessionStorage antes de darselo al componente.
            .pipe(tap(usuario => this.actualizarUsuario(usuario)));
    }

    actualizarUsuario(usuario: UsuarioAutenticado): void {
        this.usuario.set(usuario);

        try {
            sessionStorage.setItem(this.claveUsuario, JSON.stringify(usuario));
        } catch {

        }
    }

    cerrarSesion(): void {
        this.usuario.set(null);

        try {
            sessionStorage.removeItem(this.claveUsuario);
        } catch {

        }
    }

    registrar(datos: FormData): Observable<UsuarioAutenticado> {
        return this.http.post<UsuarioAutenticado>(`${this.url}/registro`, datos);
    }

    private recuperarUsuario(): UsuarioAutenticado | null {
        try {
            const datos = sessionStorage.getItem(this.claveUsuario);
            const usuario = datos ? JSON.parse(datos) : null;

            if (usuario && typeof usuario.id === 'string' && typeof usuario.nombre === 'string'
                && typeof usuario.apellido === 'string' && typeof usuario.correo === 'string'
                && typeof usuario.nombreUsuario === 'string' && typeof usuario.fechaNacimiento === 'string'
                && typeof usuario.descripcion === 'string' && typeof usuario.imagenPerfilUrl === 'string'
                && ['usuario', 'administrador'].includes(usuario.perfil)) {
                return usuario;
            }
        } catch {
            
        }

        return null;
    }
}
