import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { EstadoMeGusta, Publicacion } from '../../models/publicacion';
import { AutenticacionService } from '../../services/autenticacion.service';
import { PublicacionesService } from '../../services/publicaciones.service';
import { MensajeModal, Modal } from '../modal/modal';

@Component({
    selector: 'app-tarjeta-publicacion',
    imports: [DatePipe, Modal],
    templateUrl: './tarjeta-publicacion.html',
    styleUrl: './tarjeta-publicacion.scss',
})
export class TarjetaPublicacion {
    readonly publicacion = input.required<Publicacion>();
    readonly eliminada = output<string>();
    readonly meGustaActualizado = output<EstadoMeGusta & { id: string }>();

    private readonly autenticacion = inject(AutenticacionService);
    private readonly publicacionesService = inject(PublicacionesService);
    private readonly destroyRef = inject(DestroyRef);

    protected readonly propia = computed(() => {
        return this.publicacion().autor.id === this.autenticacion.usuarioActual()?.id;
    });

    protected readonly eliminando = signal(false);
    protected readonly actualizandoMeGusta = signal(false);
    protected readonly celebrandoMeGusta = signal(false);
    protected readonly errorMeGusta = signal<string | null>(null);
    protected readonly mensajeModal = signal<MensajeModal | null>(null);

    protected cambiarMeGusta(): void {
        if (this.propia() || this.actualizandoMeGusta() || this.eliminando()) {
            return;
        }

        if (!this.autenticacion.usuarioActual()) {
            this.errorMeGusta.set('Iniciá sesión para dar me gusta.');

            return;
        }

        const publicacion = this.publicacion();

        this.actualizandoMeGusta.set(true);
        this.celebrandoMeGusta.set(false);
        this.errorMeGusta.set(null);

        this.publicacionesService.cambiarMeGusta(publicacion.id, !publicacion.meGustaDelUsuario)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.actualizandoMeGusta.set(false)),
            )
            .subscribe({
                next: estado => {
                    this.meGustaActualizado.emit({ id: publicacion.id, ...estado });
                    this.celebrandoMeGusta.set(!publicacion.meGustaDelUsuario && estado.meGustaDelUsuario);
                },
                error: () => {
                    this.errorMeGusta.set('No se pudo actualizar el me gusta. Intentá nuevamente.');
                },
            });
    }

    protected finalizarCelebracion(evento: AnimationEvent): void {
        if (evento.target === evento.currentTarget) {
            this.celebrandoMeGusta.set(false);
        }
    }

    protected solicitarEliminacion(): void {
        if (!this.propia() || this.eliminando()) {
            return;
        }

        this.mensajeModal.set({
            tipo: 'info',
            titulo: '¿Eliminar publicación?',
            mensaje: `“${this.publicacion().titulo}” dejará de estar disponible junto con sus comentarios.`,
            textoBoton: 'Cancelar',
            textoConfirmar: 'Eliminar',
        });
    }

    protected eliminar(): void {
        if (!this.propia() || this.eliminando()) {
            return;
        }

        const id = this.publicacion().id;

        this.eliminando.set(true);

        this.publicacionesService.eliminar(id)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.eliminando.set(false)),
            )
            .subscribe({
                next: () => {
                    this.mensajeModal.set(null);
                    this.eliminada.emit(id);
                },
                error: (error: unknown) => {
                    this.mensajeModal.set({
                        tipo: 'error',
                        titulo: 'No se pudo eliminar la publicación',
                        mensaje: error instanceof HttpErrorResponse && error.status === 403
                            ? 'Solo podés eliminar tus propias publicaciones.'
                            : 'La publicación sigue en el listado. Intentá nuevamente.',
                    });
                },
            });
    }
}
