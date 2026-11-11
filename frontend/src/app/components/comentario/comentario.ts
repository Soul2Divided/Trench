import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { ComentarioPublicacion } from '../../models/publicacion';
import { AutenticacionService } from '../../services/autenticacion.service';
import { PublicacionesService } from '../../services/publicaciones.service';

@Component({
    selector: 'app-comentario',
    imports: [DatePipe, ReactiveFormsModule],
    templateUrl: './comentario.html',
    styleUrl: './comentario.scss',
})
export class Comentario {
    readonly comentario = input.required<ComentarioPublicacion>();
    readonly publicacionId = input.required<string>();
    readonly actualizado = output<ComentarioPublicacion>();

    private readonly autenticacion = inject(AutenticacionService);
    private readonly publicacionesService = inject(PublicacionesService);
    private readonly destroyRef = inject(DestroyRef);

    protected readonly propio = computed(() => this.comentario().autor.id === this.autenticacion.usuarioActual()?.id);
    protected readonly editando = signal(false);
    protected readonly guardando = signal(false);
    protected readonly errorEdicion = signal(false);
    protected readonly mensaje = new FormControl('', { nonNullable: true });

    protected editar(): void {
        this.mensaje.setValue(this.comentario().mensaje);
        this.errorEdicion.set(false);
        this.editando.set(true);
    }

    protected guardar(): void {
        const mensaje = this.mensaje.value.trim();

        if (!mensaje || !this.propio() || this.guardando()) {
            return;
        }

        this.guardando.set(true);
        this.errorEdicion.set(false);

        this.publicacionesService.editarComentario(this.publicacionId(), this.comentario().id, mensaje)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.guardando.set(false)),
            )
            .subscribe({
                next: comentario => {
                    this.actualizado.emit(comentario);
                    this.editando.set(false);
                },
                error: () => this.errorEdicion.set(true),
            });
    }
}
