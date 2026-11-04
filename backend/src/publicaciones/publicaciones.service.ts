import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { Model, QueryFilter, SortOrder } from 'mongoose';

import { CloudinaryService } from '../file/cloudinary.service.js';
import type { UsuarioDocument } from '../usuarios/schemas/usuario.schema.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto.js';
import { ListarPublicacionesDto } from './dto/listar-publicaciones.dto.js';
import { Comentario } from './schemas/comentario.schema.js';
import { Publicacion } from './schemas/publicacion.schema.js';
import type { PublicacionDocument } from './schemas/publicacion.schema.js';

interface PublicacionConCantidadComentarios {
    publicacionId: Types.ObjectId;
    cantidadComentarios: number;
}

@Injectable()
export class PublicacionesService {
    private readonly logger = new Logger(PublicacionesService.name);

    constructor(
        @InjectModel(Publicacion.name) private readonly publicacionModel: Model<Publicacion>,
        @InjectModel(Comentario.name) private readonly comentarioModel: Model<Comentario>,
        private readonly cloudinaryService: CloudinaryService,
        private readonly usuariosService: UsuariosService,
    ) {}

    async listar(consulta: ListarPublicacionesDto) {
        const filtro: QueryFilter<Publicacion> = { activa: true }; // filtra solo publicaciones activas

        if (consulta.usuarioId) {
            filtro.autor = new Types.ObjectId(consulta.usuarioId);
        }

        let orden: Record<string, SortOrder> = { fechaCreacion: -1, _id: -1 };

        if (consulta.orden === 'meGusta') {
            orden = { meGusta: -1, fechaCreacion: -1, _id: -1 };
        }

        const consultaPublicaciones = this.publicacionModel
            .find(filtro)
            .sort(orden)
            .skip(consulta.offset)
            .limit(consulta.limit)
            .populate<{ autor: UsuarioDocument }>('autor', 'nombre apellido nombreUsuario imagenPerfilUrl')
            .exec();

        const consultaTotalPublicaciones = this.publicacionModel.countDocuments(filtro).exec();

        const [publicaciones, totalPublicaciones] = await Promise.all([
            consultaPublicaciones,
            consultaTotalPublicaciones,
        ]);

        const publicacionIds = publicaciones.map(publicacion => publicacion._id);
        const cantidadComentariosPorPublicacion = await this.obtenerCantidadComentariosPorPublicacion(publicacionIds);

        const publicacionesParaMostrar = publicaciones.map(publicacion => {
            const publicacionId = publicacion._id.toString();
            const cantidadComentarios = cantidadComentariosPorPublicacion.get(publicacionId) ?? 0;

            return {
                id: publicacionId,
                autor: {
                    id: publicacion.autor._id.toString(),
                    nombre: publicacion.autor.nombre,
                    apellido: publicacion.autor.apellido,
                    nombreUsuario: publicacion.autor.nombreUsuario,
                    imagenPerfilUrl: publicacion.autor.imagenPerfilUrl,
                },
                titulo: publicacion.titulo,
                mensaje: publicacion.mensaje,
                fechaCreacion: publicacion.fechaCreacion,
                imagenUrl: publicacion.imagenUrl,
                meGusta: publicacion.meGusta,
                comentarios: cantidadComentarios,
            };
        });

        return {
            publicaciones: publicacionesParaMostrar,
            total: totalPublicaciones,
        };
    }

    async obtenerComentarios(id: string) {
        const publicacion = await this.publicacionModel.exists({ _id: id, activa: true }).exec();

        if (!publicacion) {
            throw new NotFoundException('La publicación no existe o ya no está disponible.');
        }

        const comentarios = await this.comentarioModel
            .find({ publicacion: id })
            .sort({ fechaCreacion: -1, _id: -1 })
            .populate<{ autor: UsuarioDocument }>('autor', 'nombre apellido nombreUsuario imagenPerfilUrl')
            .exec();

        const comentariosParaMostrar = comentarios.map(comentario => ({
            id: comentario._id.toString(),
            autor: {
                id: comentario.autor._id.toString(),
                nombre: comentario.autor.nombre,
                apellido: comentario.autor.apellido,
                nombreUsuario: comentario.autor.nombreUsuario,
                imagenPerfilUrl: comentario.autor.imagenPerfilUrl,
            },
            fechaCreacion: comentario.fechaCreacion,
            mensaje: comentario.mensaje,
            editado: comentario.editado,
        }));

        return comentariosParaMostrar;
    }

    async crear(datos: CrearPublicacionDto, imagen?: Express.Multer.File) {
        const usuario = await this.usuariosService.obtenerPorId(datos.usuarioId);

        const imagenSubida = imagen
            ? await this.cloudinaryService.subirImagen(imagen.buffer, 'trench/publicaciones')
            : undefined;

        let publicacion: PublicacionDocument;

        try {
            publicacion = await this.publicacionModel.create({
                autor: usuario.id,
                titulo: datos.titulo,
                mensaje: datos.mensaje,
                imagenUrl: imagenSubida?.secure_url,
                imagenPublicId: imagenSubida?.public_id,
            });
        } catch (error: unknown) {
            if (imagenSubida) {
                try {
                    await this.cloudinaryService.eliminarImagen(imagenSubida.public_id);
                } catch {
                    this.logger.warn('No se pudo eliminar la imagen de una publicación que no llegó a guardarse.');
                }
            }

            throw error;
        }

        return {
            id: publicacion._id.toString(),
            autor: {
                id: usuario.id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                nombreUsuario: usuario.nombreUsuario,
                imagenPerfilUrl: usuario.imagenPerfilUrl,
            },
            titulo: publicacion.titulo,
            mensaje: publicacion.mensaje,
            fechaCreacion: publicacion.fechaCreacion,
            imagenUrl: publicacion.imagenUrl,
            meGusta: publicacion.meGusta,
            comentarios: 0,
        };
    }

    async eliminar(id: string, usuarioId: string): Promise<void> {
        const usuario = await this.usuariosService.obtenerPorId(usuarioId);
        const publicacion = await this.publicacionModel.findOne({ _id: id, activa: true }).exec();

        if (!publicacion) {
            throw new NotFoundException('La publicación no existe o ya no está disponible.');
        }

        if (publicacion.autor.toString() !== usuario.id && usuario.perfil !== 'administrador') {
            throw new ForbiddenException('Solo el autor o un administrador pueden eliminar esta publicación.');
        }

        const resultado = await this.publicacionModel.updateOne(
            { _id: id, activa: true },
            { $set: { activa: false } },
        ).exec();

        if (resultado.matchedCount === 0) {
            throw new NotFoundException('La publicación ya no está disponible.');
        }
    }

    private async obtenerCantidadComentariosPorPublicacion(publicacionIds: Types.ObjectId[]): Promise<Map<string, number>> {
        const cantidadComentariosPorPublicacion = new Map<string, number>();

        if (publicacionIds.length === 0) {
            return cantidadComentariosPorPublicacion;
        }

        const publicacionesConCantidadComentarios = await this.comentarioModel
            .aggregate<PublicacionConCantidadComentarios>([
                {
                    $match: {
                        publicacion: { $in: publicacionIds },
                    },
                },
                {
                    $group: {
                        _id: '$publicacion',
                        cantidadComentarios: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        publicacionId: '$_id',
                        cantidadComentarios: 1,
                    },
                },
            ])
            .exec();

        for (const publicacion of publicacionesConCantidadComentarios) {
            const publicacionId = publicacion.publicacionId.toString();

            cantidadComentariosPorPublicacion.set(publicacionId, publicacion.cantidadComentarios);
        }

        return cantidadComentariosPorPublicacion;
    }

}
