import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';

import { ComentarioPublicacion } from '../../models/publicacion';

@Component({
    selector: 'app-comentario',
    imports: [DatePipe],
    templateUrl: './comentario.html',
    styleUrl: './comentario.scss',
})
export class Comentario {
    readonly comentario = input.required<ComentarioPublicacion>();
}
