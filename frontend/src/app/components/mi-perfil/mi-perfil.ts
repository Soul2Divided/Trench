import { Component } from '@angular/core';

import { Comentario, DatosComentario } from '../comentario/comentario';
import { Navbar } from '../navbar/navbar';
import { PanelUsuario } from '../panel-usuario/panel-usuario';
import { TarjetaPublicacion, DatosPublicacion } from '../tarjeta-publicacion/tarjeta-publicacion';
import { DatosPerfil, DatosUsuario } from './components/datos-perfil/datos-perfil';

interface PublicacionConComentarios extends DatosPublicacion {
    comentariosVisibles: DatosComentario[];
}

@Component({
    selector: 'app-mi-perfil',
    imports: [Navbar, PanelUsuario, DatosPerfil, TarjetaPublicacion, Comentario],
    templateUrl: './mi-perfil.html',
    styleUrl: './mi-perfil.scss',
})
export class MiPerfil {
    protected readonly usuario: DatosUsuario = {
        nombre: 'Gabriel',
        apellido: 'López',
        usuario: 'gabriel',
        iniciales: 'GL',
        correo: 'gabriel@example.com',
        fechaNacimiento: '15 de marzo de 2000',
        descripcion: 'Siempre hay una canción para cada momento. Compartiendo discos, descubriendo bandas y volviendo a Twenty One Pilots.',
    };

    protected readonly publicaciones: PublicacionConComentarios[] = [
        {
            id: 2,
            nombre: 'Gabriel López',
            usuario: 'gabriel',
            iniciales: 'GL',
            fecha: 'Hace 1 hora',
            titulo: 'Canciones para el camino',
            mensaje: 'Estoy armando una playlist para esos viajes en los que solo querés mirar por la ventana y escuchar música. Arranco con Car Radio. ¿Qué canción sumarían ustedes?',
            meGusta: 12,
            comentarios: 2,
            propia: true,
            comentariosVisibles: [
                {
                    id: 1,
                    nombre: 'Sofía Martínez',
                    iniciales: 'SM',
                    fecha: 'Hace 10 minutos',
                    mensaje: 'Sumaría Intro de The xx. Tiene algo que hace que cualquier viaje se sienta distinto.',
                },
                {
                    id: 2,
                    nombre: 'Lucas Fernández',
                    iniciales: 'LF',
                    fecha: 'Hace 40 minutos',
                    mensaje: 'Para mí no puede faltar A Car, a Torch, a Death.',
                    editado: true,
                },
            ],
        },
        {
            id: 3,
            nombre: 'Gabriel López',
            usuario: 'gabriel',
            iniciales: 'GL',
            fecha: 'Ayer',
            titulo: 'Escuchar un disco sin hacer otra cosa',
            mensaje: 'Hoy dejé el celular de lado y escuché un álbum entero. A veces hace falta frenar un poco para encontrar detalles que siempre estuvieron ahí.',
            imagen: '/images/publicacion-musica.svg',
            descripcionImagen: 'Ilustración de un disco de vinilo con la frase Un disco, mil lugares.',
            meGusta: 19,
            comentarios: 1,
            propia: true,
            comentariosVisibles: [
                {
                    id: 3,
                    nombre: 'Sofía Martínez',
                    iniciales: 'SM',
                    fecha: 'Ayer',
                    mensaje: 'Eso mismo hice el fin de semana. Escucharlo en orden cambia mucho la experiencia.',
                },
            ],
        },
        {
            id: 4,
            nombre: 'Gabriel López',
            usuario: 'gabriel',
            iniciales: 'GL',
            fecha: 'Hace 3 días',
            titulo: 'Ese primer recital',
            mensaje: 'Hay canciones que después de escucharlas en vivo nunca vuelven a sonar igual. ¿Qué recital les quedó grabado para siempre?',
            meGusta: 8,
            comentarios: 0,
            propia: true,
            comentariosVisibles: [],
        },
    ];
}
