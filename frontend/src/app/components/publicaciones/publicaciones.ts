import { Component } from '@angular/core';

import { CrearPublicacion } from './components/crear-publicacion/crear-publicacion';
import { Navbar } from '../navbar/navbar';
import { PanelUsuario } from '../panel-usuario/panel-usuario';
import { TarjetaPublicacion, DatosPublicacion } from '../tarjeta-publicacion/tarjeta-publicacion';

@Component({
    imports: [CrearPublicacion, Navbar, PanelUsuario, TarjetaPublicacion],
    selector: 'app-publicaciones',
    styleUrl: './publicaciones.scss',
    templateUrl: './publicaciones.html',
})
export class Publicaciones {
    protected readonly publicaciones: DatosPublicacion[] = [
        {
            id: 1,
            nombre: 'Sofía Martínez',
            usuario: 'sofi.en.repeat',
            iniciales: 'SM',
            fecha: 'Hace 25 minutos',
            titulo: 'Un disco al que siempre vuelvo',
            mensaje: 'Hay discos que se sienten como un lugar. Hoy volví a escuchar Trench de principio a fin y me pasó otra vez. ¿Cuál es ese álbum al que siempre terminan volviendo?',
            imagen: '/images/publicacion-musica.svg',
            descripcionImagen: 'Ilustración de un vinilo rosa y amarillo con la frase Un disco, mil lugares.',
            meGusta: 24,
            comentarios: 8,
            propia: false,
        },
        {
            id: 2,
            nombre: 'Gabriel López',
            usuario: 'gabriel',
            iniciales: 'GL',
            fecha: 'Hace 1 hora',
            titulo: 'Canciones para el camino',
            mensaje: 'Estoy armando una playlist para esos viajes en los que solo querés mirar por la ventana y escuchar música. Arranco con Car Radio. ¿Qué canción sumarían ustedes?',
            meGusta: 12,
            comentarios: 3,
            propia: true,
        },
    ];
}
