import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { ImagenRespaldoDirective } from '../../directivas/imagen-respaldo.directive';
import { EstadoUsuarioPipe } from '../../pipes/estado-usuario.pipe';
import { AutenticacionService } from '../../services/autenticacion.service';
import { UsuarioAdministrado, UsuariosService } from '../../services/usuarios.service';
import { MensajeModal, Modal } from '../modal/modal';
import { Navbar } from '../navbar/navbar';
import { PanelUsuario } from '../panel-usuario/panel-usuario';
import { CrearUsuario } from './components/crear-usuario/crear-usuario';

@Component({
    selector: 'app-usuarios',
    imports: [ImagenRespaldoDirective, EstadoUsuarioPipe, Navbar, PanelUsuario, Modal, CrearUsuario],
    templateUrl: './usuarios.html',
    styleUrl: './usuarios.scss',
})
export class Usuarios implements OnInit {
    private readonly usuariosService = inject(UsuariosService);
    private readonly autenticacion = inject(AutenticacionService);
    private readonly destroyRef = inject(DestroyRef);

    protected readonly usuarioActual = this.autenticacion.usuarioActual;
    protected readonly usuarios = signal<UsuarioAdministrado[]>([]);
    protected readonly cargando = signal(false);
    protected readonly actualizando = signal(false);
    protected readonly errorCarga = signal<string | null>(null);
    protected readonly confirmacion = signal<string | null>(null);
    protected readonly mostrarCreacion = signal(false);
    protected readonly mensajeModal = signal<MensajeModal | null>(null);
    protected readonly usuarioSeleccionado = signal<UsuarioAdministrado | null>(null);
    protected readonly busqueda = signal('');
    protected readonly pagina = signal(1);
    protected readonly cantidadPorPagina = 5;

    protected readonly usuariosFiltrados = computed(() => {
        const texto = this.busqueda().trim().toLocaleLowerCase('es-AR');

        return this.usuarios().filter(usuario => {
            const datos = `${usuario.nombre} ${usuario.apellido} ${usuario.nombreUsuario} ${usuario.correo}`;

            return datos.toLocaleLowerCase('es-AR').includes(texto);
        });
    });

    protected readonly totalPaginas = computed(() => {
        return Math.max(1, Math.ceil(this.usuariosFiltrados().length / this.cantidadPorPagina));
    });

    protected readonly usuariosVisibles = computed(() => {
        const inicio = (this.pagina() - 1) * this.cantidadPorPagina;

        return this.usuariosFiltrados().slice(inicio, inicio + this.cantidadPorPagina);
    });

    ngOnInit(): void {
        this.cargarUsuarios();
    }

    protected cargarUsuarios(): void {
        if (this.cargando()) {
            return;
        }

        this.cargando.set(true);
        this.errorCarga.set(null);

        this.usuariosService.listar()
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.cargando.set(false)),
            )
            .subscribe({
                next: usuarios => {
                    this.usuarios.set(usuarios);
                    this.pagina.set(1);
                },
                error: (error: unknown) => {
                    this.errorCarga.set(this.obtenerMensajeError(error, 'No se pudo cargar el listado de usuarios.'));
                },
            });
    }

    protected buscar(evento: Event): void {
        this.busqueda.set((evento.target as HTMLInputElement).value);
        this.pagina.set(1);
    }

    protected cambiarPagina(desplazamiento: number): void {
        this.pagina.update(actual => Math.min(this.totalPaginas(), Math.max(1, actual + desplazamiento)));
    }

    protected completarCreacion(): void {
        this.mostrarCreacion.set(false);
        this.busqueda.set('');
        this.confirmacion.set('El usuario se creó correctamente.');
        this.cargarUsuarios();
    }

    protected solicitarCambio(usuario: UsuarioAdministrado): void {
        if (this.actualizando() || usuario.id === this.usuarioActual()?.id) {
            return;
        }

        this.usuarioSeleccionado.set(usuario);
        this.mensajeModal.set({
            tipo: 'info',
            titulo: usuario.habilitado ? '¿Deshabilitar usuario?' : '¿Habilitar usuario?',
            mensaje: usuario.habilitado
                ? `${usuario.nombreUsuario} perderá el acceso a la aplicación. Sus datos y publicaciones se conservarán.`
                : `${usuario.nombreUsuario} podrá volver a ingresar a la aplicación.`,
            textoBoton: 'Cancelar',
            textoConfirmar: usuario.habilitado ? 'Deshabilitar' : 'Habilitar',
            textoProcesando: 'Guardando…',
        });
    }

    protected cambiarHabilitacion(): void {
        const usuario = this.usuarioSeleccionado();

        if (!usuario || this.actualizando()) {
            return;
        }

        const peticion = usuario.habilitado
            ? this.usuariosService.deshabilitar(usuario.id)
            : this.usuariosService.habilitar(usuario.id);

        this.actualizando.set(true);
        this.confirmacion.set(null);

        peticion.pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => this.actualizando.set(false)),
        ).subscribe({
            next: actualizado => {
                this.usuarios.update(usuarios => usuarios.map(actual => {
                    return actual.id === actualizado.id ? actualizado : actual;
                }));
                this.confirmacion.set(`${actualizado.nombreUsuario}: ${actualizado.habilitado ? 'usuario habilitado' : 'usuario deshabilitado'}.`);
                this.cerrarMensaje();
            },
            error: (error: unknown) => {
                this.usuarioSeleccionado.set(null);
                this.mensajeModal.set({
                    tipo: 'error',
                    titulo: 'No se pudo actualizar el usuario',
                    mensaje: this.obtenerMensajeError(error, 'Intentá nuevamente.'),
                });
            },
        });
    }

    protected cerrarMensaje(): void {
        this.usuarioSeleccionado.set(null);
        this.mensajeModal.set(null);
    }

    private obtenerMensajeError(error: unknown, alternativa: string): string {
        if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
            return error.error.message;
        }

        return alternativa;
    }
}
