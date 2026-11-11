export interface AutorPublicacion {
    id: string;
    nombre: string;
    apellido: string;
    nombreUsuario: string;
    imagenPerfilUrl: string;
}

export interface Publicacion {
    id: string;
    autor: AutorPublicacion;
    titulo: string;
    mensaje: string;
    fechaCreacion: string;
    imagenUrl?: string;
    meGusta: number;
    meGustaDelUsuario: boolean;
    comentarios: number;
}

export type OrdenPublicaciones = 'fecha' | 'meGusta';

export interface EstadoMeGusta {
    meGusta: number;
    meGustaDelUsuario: boolean;
}

export interface ConsultaPublicaciones {
    offset: number;
    limit: number;
    orden: OrdenPublicaciones;
    autorId?: string;
}

export interface PaginaPublicaciones {
    publicaciones: Publicacion[];
    total: number;
}

export interface ComentarioPublicacion {
    id: string;
    autor: AutorPublicacion;
    fechaCreacion: string;
    mensaje: string;
    editado: boolean;
}

export interface PaginaComentarios {
    comentarios: ComentarioPublicacion[];
    total: number;
}
