export interface PeriodoEstadisticas {
    desde: string;
    hasta: string;
}

export interface PublicacionesPorUsuario {
    usuarioId: string;
    nombre: string;
    apellido: string;
    nombreUsuario: string;
    cantidad: number;
}

export interface ComentariosPorFecha {
    fecha: string;
    cantidad: number;
}

export interface ResumenComentariosPorFecha {
    total: number;
    comentarios: ComentariosPorFecha[];
}

export interface ComentariosPorPublicacion {
    publicacionId: string;
    titulo: string;
    cantidad: number;
}
