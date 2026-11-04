import { Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subscription } from 'rxjs';

import { ComentarioPublicacion } from '../../models/publicacion';
import { PublicacionesService } from '../../services/publicaciones.service';
import { Comentario } from '../comentario/comentario';

@Component({
    selector: 'app-comentarios-publicacion',
    imports: [Comentario],
    templateUrl: './comentarios-publicacion.html',
    styleUrl: './comentarios-publicacion.scss',
})
export class ComentariosPublicacion {
    readonly publicacionId = input.required<string>();

    private readonly publicacionesService = inject(PublicacionesService);
    private readonly destroyRef = inject(DestroyRef);

    private peticion: Subscription | null = null;

    protected readonly comentarios = signal<ComentarioPublicacion[]>([]);
    protected readonly cargando = signal(false);
    protected readonly errorCarga = signal(false);

    constructor() {
        effect(() => this.cargar(this.publicacionId()));
    }

    protected cargar(id: string): void {
        this.peticion?.unsubscribe();
        this.comentarios.set([]);
        this.errorCarga.set(false);
        this.cargando.set(true);

        this.peticion = this.publicacionesService.obtenerComentarios(id)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.cargando.set(false)),
            )
            .subscribe({
                next: comentarios => this.comentarios.set(comentarios),
                error: () => this.errorCarga.set(true),
            });
    }
}
