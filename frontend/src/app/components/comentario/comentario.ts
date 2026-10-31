import { Component, input } from '@angular/core';

export interface DatosComentario {
    id: number;
    nombre: string;
    iniciales: string;
    fecha: string;
    mensaje: string;
    editado?: boolean;
}

@Component({
    selector: 'app-comentario',
    templateUrl: './comentario.html',
    styleUrl: './comentario.scss',
})
export class Comentario {
    readonly comentario = input.required<DatosComentario>();
}
