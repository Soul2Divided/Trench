import { Component, input } from '@angular/core';

export interface DatosPublicacion {
    id: number;
    nombre: string;
    usuario: string;
    iniciales: string;
    fecha: string;
    titulo: string;
    mensaje: string;
    imagen?: string;
    descripcionImagen?: string;
    meGusta: number;
    comentarios: number;
    propia: boolean;
}

@Component({
    selector: 'app-tarjeta-publicacion',
    templateUrl: './tarjeta-publicacion.html',
    styleUrl: './tarjeta-publicacion.scss',
})
export class TarjetaPublicacion {
    readonly publicacion = input.required<DatosPublicacion>();
}
