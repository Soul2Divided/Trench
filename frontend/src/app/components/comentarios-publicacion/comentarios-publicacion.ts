import { Component, DestroyRef, ElementRef, inject, input, OnInit, output, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { ComentarioPublicacion } from '../../models/publicacion';
import { PublicacionesService } from '../../services/publicaciones.service';
import { AutenticacionService } from '../../services/autenticacion.service';
import { Comentario } from '../comentario/comentario';
import { MensajeModal, Modal } from '../modal/modal';

@Component({
    selector: 'app-comentarios-publicacion',
    imports: [Comentario, ReactiveFormsModule, Modal],
    templateUrl: './comentarios-publicacion.html',
    styleUrl: './comentarios-publicacion.scss',
})
export class ComentariosPublicacion implements OnInit {
    readonly publicacionId = input.required<string>();
    readonly totalActualizado = output<number>();

    private readonly publicacionesService = inject(PublicacionesService);
    private readonly autenticacion = inject(AutenticacionService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly campoMensaje = viewChild<ElementRef<HTMLTextAreaElement>>('campoMensaje');

    private readonly limite = 5;
    private offset = 0;
    private comentarioAEliminar: ComentarioPublicacion | null = null;

    protected readonly comentarios = signal<ComentarioPublicacion[]>([]);
    protected readonly cargando = signal(false);
    protected readonly errorCarga = signal(false);
    protected readonly hayMas = signal(true);
    protected readonly total = signal(0);
    protected readonly enviando = signal(false);
    protected readonly errorEnvio = signal(false);
    protected readonly mensaje = new FormControl('', { nonNullable: true });
    protected readonly comentarioEditando = signal<ComentarioPublicacion | null>(null);
    protected readonly eliminando = signal(false);
    protected readonly mensajeModal = signal<MensajeModal | null>(null);

    ngOnInit(): void {
        this.cargarMas();
    }

    protected cargarMas(): void {
        if (this.cargando() || this.enviando() || this.eliminando() || !this.hayMas()) {
            return;
        }

        this.errorCarga.set(false);
        this.cargando.set(true);

        this.publicacionesService.obtenerComentarios(this.publicacionId(), this.offset, this.limite)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.cargando.set(false)),
            )
            .subscribe({
                next: pagina => {
                    this.offset += pagina.comentarios.length;
                    this.comentarios.update(actuales => {
                        const ids = new Set(actuales.map(comentario => comentario.id));

                        return [...actuales, ...pagina.comentarios.filter(comentario => !ids.has(comentario.id))]
                            .sort((a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime()
                                || a.id.localeCompare(b.id));
                    });
                    this.total.set(pagina.total);
                    this.totalActualizado.emit(pagina.total);
                    this.hayMas.set(pagina.comentarios.length > 0 && this.offset < pagina.total);
                },
                error: () => this.errorCarga.set(true),
            });
    }

    protected guardarComentario(evento: Event): void {
        evento.preventDefault();

        const mensaje = this.mensaje.value.trim();
        const editando = this.comentarioEditando();

        if (!mensaje || this.enviando() || this.cargando() || this.eliminando()) {
            return;
        }

        this.enviando.set(true);
        this.errorEnvio.set(false);

        const peticion = editando
            ? this.publicacionesService.editarComentario(this.publicacionId(), editando.id, mensaje)
            : this.publicacionesService.crearComentario(this.publicacionId(), mensaje);

        peticion
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.enviando.set(false)),
            )
            .subscribe({
                next: comentario => {
                    if (editando) {
                        this.comentarios.update(actuales => actuales.map(actual => actual.id === comentario.id ? comentario : actual));
                    } else {
                        this.comentarios.update(actuales => [...actuales, comentario]);

                        if (!this.hayMas()) {
                            this.offset += 1;
                        }

                        this.total.update(total => total + 1);
                        this.totalActualizado.emit(this.total());
                    }

                    this.cancelarEdicion();
                },
                error: () => this.errorEnvio.set(true),
            });
    }

    protected editarComentario(comentario: ComentarioPublicacion): void {
        if (this.enviando() || this.eliminando() || comentario.autor.id !== this.autenticacion.usuarioActual()?.id) {
            return;
        }

        this.comentarioEditando.set(comentario);
        this.mensaje.setValue(comentario.mensaje);
        this.errorEnvio.set(false);
        this.campoMensaje()?.nativeElement.focus();
    }

    protected cancelarEdicion(): void {
        this.comentarioEditando.set(null);
        this.mensaje.reset();
        this.errorEnvio.set(false);
    }

    protected solicitarEliminacion(comentario: ComentarioPublicacion): void {
        if (this.enviando() || this.eliminando() || comentario.autor.id !== this.autenticacion.usuarioActual()?.id) {
            return;
        }

        this.comentarioAEliminar = comentario;
        this.mensajeModal.set({
            tipo: 'info',
            titulo: '¿Eliminar comentario?',
            mensaje: 'El comentario dejará de estar disponible en esta publicación.',
            textoBoton: 'Cancelar',
            textoConfirmar: 'Eliminar',
        });
    }

    protected eliminarComentario(): void {
        const comentario = this.comentarioAEliminar;

        if (!comentario || this.eliminando() || this.enviando() || this.cargando()) {
            return;
        }

        this.eliminando.set(true);

        this.publicacionesService.eliminarComentario(this.publicacionId(), comentario.id)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.eliminando.set(false)),
            )
            .subscribe({
                next: () => {
                    const indice = this.comentarios().findIndex(actual => actual.id === comentario.id);

                    if (indice >= 0 && indice < this.offset) {
                        this.offset -= 1;
                    }

                    this.comentarios.update(actuales => actuales.filter(actual => actual.id !== comentario.id));
                    this.total.update(total => Math.max(0, total - 1));
                    this.hayMas.set(this.offset < this.total());
                    this.totalActualizado.emit(this.total());
                    this.mensajeModal.set(null);
                    this.comentarioAEliminar = null;

                    if (this.comentarioEditando()?.id === comentario.id) {
                        this.cancelarEdicion();
                    }
                },
                error: () => this.mensajeModal.set({
                    tipo: 'error',
                    titulo: 'No se pudo eliminar el comentario',
                    mensaje: 'El comentario sigue en el listado. Intentá nuevamente.',
                    textoBoton: 'Cancelar',
                    textoConfirmar: 'Reintentar',
                }),
            });
    }
}
