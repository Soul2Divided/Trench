import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { mongo, Types } from 'mongoose';
import type { Connection } from 'mongoose';
import type { Model, QueryFilter, SortOrder } from 'mongoose';

import { CloudinaryService } from '../file/cloudinary.service.js';
import type { UsuarioDocument } from '../usuarios/schemas/usuario.schema.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto.js';
import { CrearComentarioDto } from './dto/crear-comentario.dto.js';
import { ListarComentariosDto } from './dto/listar-comentarios.dto.js';
import { ListarPublicacionesDto } from './dto/listar-publicaciones.dto.js';
import { Comentario } from './schemas/comentario.schema.js';
import { MeGusta } from './schemas/me-gusta.schema.js';
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
        @InjectModel(MeGusta.name) private readonly meGustaModel: Model<MeGusta>,
        @InjectConnection() private readonly conexion: Connection,
        private readonly cloudinaryService: CloudinaryService,
        private readonly usuariosService: UsuariosService,
    ) {}

    /* --- Publicaciones --- */

    async listar(consulta: ListarPublicacionesDto, usuarioActualId: string) {
        const filtro: QueryFilter<Publicacion> = { activa: true };

        if (consulta.autorId) {
            filtro.autor = new Types.ObjectId(consulta.autorId);
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
        const [cantidadComentariosPorPublicacion, meGustaDelUsuario] = await Promise.all([
            this.obtenerCantidadComentariosPorPublicacion(publicacionIds),
            publicacionIds.length > 0
                ? this.meGustaModel.find({
                    usuario: usuarioActualId,
                    publicacion: { $in: publicacionIds },
                }).select('publicacion').lean().exec()
                : Promise.resolve([]),
        ]);

        const publicacionesConMeGusta = new Set(meGustaDelUsuario.map(relacion => relacion.publicacion.toString()));

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
                meGustaDelUsuario: publicacionesConMeGusta.has(publicacionId),
                comentarios: cantidadComentarios,
            };
        });

        return {
            publicaciones: publicacionesParaMostrar,
            total: totalPublicaciones,
        };
    }

    async crear(usuarioId: string, datos: CrearPublicacionDto, imagen?: Express.Multer.File) {
        const usuario = await this.usuariosService.obtenerPorId(usuarioId);

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
            meGustaDelUsuario: false,
            comentarios: 0,
        };
    }

    async eliminar(id: string, usuarioId: string): Promise<void> {
        const usuario = await this.usuariosService.obtenerPorId(usuarioId);
        const publicacion = await this.publicacionModel.findOne({ _id: id, activa: true }).exec();

        if (!publicacion) {
            throw new NotFoundException('La publicación no existe o ya no está disponible.');
        }

        if (publicacion.autor.toString() !== usuario.id && usuario.rol !== 'administrador') {
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

    /* --- Comentarios --- */

    async obtenerComentarios(id: string, consulta: ListarComentariosDto) {
        const publicacion = await this.publicacionModel.exists({ _id: id, activa: true }).exec();

        if (!publicacion) {
            throw new NotFoundException('La publicación no existe o ya no está disponible.');
        }

        const consultaComentarios = this.comentarioModel
            .find({ publicacion: id })
            .sort({ fechaCreacion: 1, _id: 1 })
            .skip(consulta.offset)
            .limit(consulta.limit)
            .populate<{ autor: UsuarioDocument }>('autor', 'nombre apellido nombreUsuario imagenPerfilUrl')
            .exec();

        const [comentarios, total] = await Promise.all([
            consultaComentarios,
            this.comentarioModel.countDocuments({ publicacion: id }).exec(),
        ]);

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

        return { comentarios: comentariosParaMostrar, total };
    }

    async crearComentario(id: string, usuarioId: string, datos: CrearComentarioDto) {
        const usuario = await this.usuariosService.obtenerPorId(usuarioId);
        const publicacion = await this.publicacionModel.exists({ _id: id, activa: true }).exec();

        if (!publicacion) {
            throw new NotFoundException('La publicación no existe o ya no está disponible.');
        }

        const comentario = new this.comentarioModel({
            publicacion: id,
            autor: usuario.id,
            mensaje: datos.mensaje,
        });

        await comentario.save();

        return {
            id: comentario._id.toString(),
            autor: {
                id: usuario.id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                nombreUsuario: usuario.nombreUsuario,
                imagenPerfilUrl: usuario.imagenPerfilUrl,
            },
            fechaCreacion: comentario.fechaCreacion,
            mensaje: comentario.mensaje,
            editado: comentario.editado,
        };
    }

    async actualizarComentario(id: string, comentarioId: string, usuarioId: string, datos: CrearComentarioDto) {
        const { comentario, usuario } = await this.obtenerComentarioPropio(id, comentarioId, usuarioId);

        comentario.mensaje = datos.mensaje;
        comentario.editado = true;

        await comentario.save();

        return {
            id: comentario._id.toString(),
            autor: {
                id: usuario.id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                nombreUsuario: usuario.nombreUsuario,
                imagenPerfilUrl: usuario.imagenPerfilUrl,
            },
            fechaCreacion: comentario.fechaCreacion,
            mensaje: comentario.mensaje,
            editado: comentario.editado,
        };
    }

    async eliminarComentario(id: string, comentarioId: string, usuarioId: string): Promise<void> {
        const { comentario } = await this.obtenerComentarioPropio(id, comentarioId, usuarioId);

        await comentario.deleteOne();
    }

    private async obtenerComentarioPropio(id: string, comentarioId: string, usuarioId: string) {
        const usuario = await this.usuariosService.obtenerPorId(usuarioId);
        const publicacion = await this.publicacionModel.exists({ _id: id, activa: true }).exec();

        if (!publicacion) {
            throw new NotFoundException('La publicación no existe o ya no está disponible.');
        }

        const comentario = await this.comentarioModel.findOne({ _id: comentarioId, publicacion: id }).exec();

        if (!comentario) {
            throw new NotFoundException('El comentario no existe en esta publicación.');
        }

        if (!comentario.autor.equals(usuario.id)) {
            throw new ForbiddenException('Solo el autor puede editar o eliminar este comentario.');
        }

        return { comentario, usuario };
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

    /* --- Me gusta --- */

    async cambiarMeGusta(id: string, usuarioId: string, darMeGusta: boolean) {
        await this.usuariosService.obtenerPorId(usuarioId);

        const relacion = {
            usuario: new Types.ObjectId(usuarioId),
            publicacion: new Types.ObjectId(id),
        };

        // La funcion "transaccion" se utiliza para asegurar que las operaciones de base de datos se realicen de manera atómica.
        // Si ocurre un error durante la transacción, todos los cambios realizados dentro de ella se revertirán, garantizando la consistencia de los datos.
        const actualizar = () => this.conexion.transaction(async session => {
            const publicacion = await this.publicacionModel
                .findOne({ _id: id, activa: true })
                // La session identifica el contexto de la transacción.
                // Se pasa a cada operación para que participe en ella y sus cambios
                // se confirmen o reviertan junto con los demás.
                .session(session)
                .exec();

            if (!publicacion) {
                throw new NotFoundException('La publicación no existe o ya no está disponible.');
            }

            if (darMeGusta && publicacion.autor.equals(relacion.usuario)) {
                throw new ForbiddenException('No podés dar me gusta a tus propias publicaciones.');
            }

            let variacion = 0;

            if (darMeGusta) {
                const resultado = await this.meGustaModel.updateOne(
                    relacion,
                    { $setOnInsert: relacion },
                    { upsert: true, session },
                ).exec();

                // Si upsertedCount es 1, significa que se insertó un nuevo documento,
                // lo que indica que el usuario le dio "me gusta" a la publicación.
                variacion = resultado.upsertedCount === 1 ? 1 : 0;
            } else {
                const resultado = await this.meGustaModel.deleteOne(relacion, { session }).exec();

                variacion = resultado.deletedCount === 1 ? -1 : 0;
            }

            if (variacion !== 0) {
                publicacion.meGusta += variacion;

                await publicacion.save({ session });
            }

            return {
                meGusta: publicacion.meGusta,
                meGustaDelUsuario: darMeGusta,
            };
        });

        try {
            return await actualizar();
        } catch (error: unknown) {
            if (error instanceof mongo.MongoServerError && error.code === 11000) {
                return actualizar();
            }

            throw error;
        }
    }
}
