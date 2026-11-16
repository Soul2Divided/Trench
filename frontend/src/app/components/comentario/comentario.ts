import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';

import { ComentarioPublicacion } from '../../models/publicacion';
import { AutenticacionService } from '../../services/autenticacion.service';

import { ImagenRespaldoDirective } from '../../directivas/imagen-respaldo.directive';
import { TiempoTranscurridoPipe } from '../../pipes/tiempo-transcurrido.pipe';

@Component({
    selector: 'app-comentario',
    imports: [ImagenRespaldoDirective, TiempoTranscurridoPipe, DatePipe],
    templateUrl: './comentario.html',
    styleUrl: './comentario.scss',
})
export class Comentario {
    readonly comentario = input.required<ComentarioPublicacion>();
    readonly bloqueado = input(false);
    readonly enEdicion = input(false);
    readonly editar = output<ComentarioPublicacion>();
    readonly eliminar = output<ComentarioPublicacion>();

    private readonly autenticacion = inject(AutenticacionService);

    protected readonly propio = computed(() => this.comentario().autor.id === this.autenticacion.usuarioActual()?.id);
}
