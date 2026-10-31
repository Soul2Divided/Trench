import { Component, input } from '@angular/core';

export interface DatosUsuario {
    nombre: string;
    apellido: string;
    usuario: string;
    iniciales: string;
    correo: string;
    fechaNacimiento: string;
    descripcion: string;
}

@Component({
    selector: 'app-datos-perfil',
    templateUrl: './datos-perfil.html',
    styleUrl: './datos-perfil.scss',
})
export class DatosPerfil {
    readonly usuario = input.required<DatosUsuario>();
    readonly cantidadPublicaciones = input.required<number>();
}
