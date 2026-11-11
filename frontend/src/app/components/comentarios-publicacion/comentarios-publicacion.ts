import { Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { ComentarioPublicacion } from '../../models/publicacion';
import { PublicacionesService } from '../../services/publicaciones.service';
import { Comentario } from '../comentario/comentario';

@Component({
    selector: 'app-comentarios-publicacion',
    imports: [Comentario, ReactiveFormsModule],
    templateUrl: './comentarios-publicacion.html',
    styleUrl: './comentarios-publicacion.scss',
})
export class ComentariosPublicacion implements OnInit {
    readonly publicacionId = input.required<string>();
    readonly totalActualizado = output<number>();

    private readonly publicacionesService = inject(PublicacionesService);
    private readonly destroyRef = inject(DestroyRef);

    private readonly limite = 5;
    private offset = 0;

    protected readonly comentarios = signal<ComentarioPublicacion[]>([]);
    protected readonly cargando = signal(false);
    protected readonly errorCarga = signal(false);
    protected readonly hayMas = signal(true);
    protected readonly total = signal(0);
    protected readonly enviando = signal(false);
    protected readonly errorEnvio = signal(false);
    protected readonly mensaje = new FormControl('', { nonNullable: true });

    ngOnInit(): void {
        this.cargarMas();
    }

    protected cargarMas(): void {
        if (this.cargando() || this.enviando() || !this.hayMas()) {
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

                        return [...actuales, ...pagina.comentarios.filter(comentario => !ids.has(comentario.id))];
                    });
                    this.total.set(pagina.total);
                    this.totalActualizado.emit(pagina.total);
                    this.hayMas.set(pagina.comentarios.length > 0 && this.offset < pagina.total);
                },
                error: () => this.errorCarga.set(true),
            });
    }

    protected comentar(): void {
        const mensaje = this.mensaje.value.trim();

        if (!mensaje || this.enviando() || this.cargando()) {
            return;
        }

        this.enviando.set(true);
        this.errorEnvio.set(false);

        this.publicacionesService.crearComentario(this.publicacionId(), mensaje)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.enviando.set(false)),
            )
            .subscribe({
                next: comentario => {
                    this.comentarios.update(actuales => [comentario, ...actuales]);
                    this.offset += 1;
                    this.total.update(total => total + 1);
                    this.totalActualizado.emit(this.total());
                    this.mensaje.reset();
                },
                error: () => this.errorEnvio.set(true),
            });
    }

    protected actualizarComentario(comentario: ComentarioPublicacion): void {
        this.comentarios.update(actuales => actuales.map(actual => actual.id === comentario.id ? comentario : actual));
    }
}
