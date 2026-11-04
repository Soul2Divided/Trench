import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize, Subscription } from 'rxjs';

import { Publicacion } from '../../models/publicacion';
import { AutenticacionService, UsuarioAutenticado } from '../../services/autenticacion.service';
import { PublicacionesService } from '../../services/publicaciones.service';
import { UsuariosService } from '../../services/usuarios.service';
import { ComentariosPublicacion } from '../comentarios-publicacion/comentarios-publicacion';
import { Navbar } from '../navbar/navbar';
import { PanelUsuario } from '../panel-usuario/panel-usuario';
import { TarjetaPublicacion } from '../tarjeta-publicacion/tarjeta-publicacion';
import { DatosPerfil } from './components/datos-perfil/datos-perfil';

@Component({
    selector: 'app-mi-perfil',
    imports: [Navbar, PanelUsuario, DatosPerfil, TarjetaPublicacion, ComentariosPublicacion, RouterLink],
    templateUrl: './mi-perfil.html',
    styleUrl: './mi-perfil.scss',
})
export class MiPerfil implements OnInit {
    private readonly autenticacion = inject(AutenticacionService);
    private readonly usuariosService = inject(UsuariosService);
    private readonly publicacionesService = inject(PublicacionesService);
    private readonly destroyRef = inject(DestroyRef);

    private peticionUsuario: Subscription | null = null;
    private peticionPublicaciones: Subscription | null = null;

    protected readonly sesion = this.autenticacion.usuarioActual;
    protected readonly usuario = signal<UsuarioAutenticado | null>(null);
    protected readonly publicaciones = signal<Publicacion[]>([]);
    protected readonly totalPublicaciones = signal<number | null>(null);
    protected readonly cargandoUsuario = signal(false);
    protected readonly cargandoPublicaciones = signal(false);
    protected readonly errorUsuario = signal(false);
    protected readonly errorPublicaciones = signal(false);

    ngOnInit(): void {
        this.cargarUsuario();
        this.cargarPublicaciones();
    }

    protected cargarUsuario(): void {
        const id = this.sesion()?.id;

        if (!id) {
            return;
        }

        this.peticionUsuario?.unsubscribe();
        this.cargandoUsuario.set(true);
        this.errorUsuario.set(false);

        this.peticionUsuario = this.usuariosService.obtenerPorId(id)
            .pipe(
                // takeUntilDestroyed cancela la suscripción si se destruye el componente, por ejemplo al navegar a otra pantalla
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.cargandoUsuario.set(false)),
            )
            .subscribe({
                next: usuario => {
                    this.usuario.set(usuario);
                    this.autenticacion.actualizarUsuario(usuario);
                },
                error: () => this.errorUsuario.set(true),
            });
    }

    protected actualizarPerfil(usuarioActualizado: UsuarioAutenticado): void {
        this.usuario.set(usuarioActualizado);
        this.autenticacion.actualizarUsuario(usuarioActualizado);
        this.cargarPublicaciones();
    }

    protected cargarPublicaciones(): void {
        const usuarioId = this.sesion()?.id;

        if (!usuarioId) {
            return;
        }

        this.peticionPublicaciones?.unsubscribe();
        this.cargandoPublicaciones.set(true);
        this.errorPublicaciones.set(false);
        this.totalPublicaciones.set(null);

        this.peticionPublicaciones = this.publicacionesService.listar({
            usuarioId,
            offset: 0,
            limit: 3,
            orden: 'fecha',
        })
            .pipe(
                // takeUntilDestroyed cancela la suscripción si se destruye el componente, por ejemplo al navegar a otra pantalla
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.cargandoPublicaciones.set(false)),
            )
            .subscribe({
                next: pagina => {
                    this.publicaciones.set(pagina.publicaciones);
                    this.totalPublicaciones.set(pagina.total);
                },
                error: () => this.errorPublicaciones.set(true),
            });
    }
}
