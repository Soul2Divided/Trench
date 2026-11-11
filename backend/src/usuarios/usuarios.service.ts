import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { mongo } from 'mongoose';
import type { Model } from 'mongoose';
import { Usuario } from './schemas/usuario.schema.js';
import type { UsuarioDocument } from './schemas/usuario.schema.js';
import { CloudinaryService } from '../file/cloudinary.service.js';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto.js';

export interface DatosNuevoUsuario {
    nombre: string;
    apellido: string;
    correo: string;
    nombreUsuario: string;
    contrasenaHash: string;
    fechaNacimiento: Date;
    descripcion: string;
    imagenPerfilUrl: string;
    imagenPerfilPublicId: string;
}

@Injectable()
export class UsuariosService {
    private readonly logger = new Logger(UsuariosService.name);

    constructor(
        @InjectModel(Usuario.name) private readonly usuarioModel: Model<Usuario>,
        private readonly cloudinaryService: CloudinaryService,
    ) {}

    async obtenerPorId(id: string) {
        const usuario = await this.usuarioModel.findById(id).exec();

        if (!usuario) {
            throw new NotFoundException('El usuario no existe.');
        }

        return {
            id: usuario._id.toString(),
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            correo: usuario.correo,
            nombreUsuario: usuario.nombreUsuario,
            fechaNacimiento: usuario.fechaNacimiento,
            descripcion: usuario.descripcion,
            imagenPerfilUrl: usuario.imagenPerfilUrl,
            rol: usuario.rol,
        };
    }

    async actualizarPerfil(id: string, datos: ActualizarPerfilDto, imagen?: Express.Multer.File) {
        const usuario = await this.usuarioModel.findById(id).exec();

        if (!usuario) {
            throw new NotFoundException('El usuario no existe.');
        }

        const fechaNacimiento = new Date(`${datos.fechaNacimiento}T00:00:00`);
        const hoy = new Date();

        hoy.setHours(0, 0, 0, 0);

        if (fechaNacimiento >= hoy) {
            throw new BadRequestException('La fecha de nacimiento debe ser anterior a hoy.');
        }

        const nombreUsuario = datos.nombreUsuario.trim();

        const usuarioConMismoNombre = await this.usuarioModel.findOne({
            nombreUsuario,
            _id: { $ne: id },
        }).exec();

        if (usuarioConMismoNombre) {
            throw new ConflictException('El nombre de usuario ya está registrado.');
        }

        const imagenAnteriorPublicId = usuario.imagenPerfilPublicId;
        const imagenSubida = imagen ? await this.cloudinaryService.subirImagen(imagen.buffer) : undefined;

        usuario.nombre = datos.nombre.trim();
        usuario.apellido = datos.apellido.trim();
        usuario.nombreUsuario = nombreUsuario;
        usuario.fechaNacimiento = new Date(datos.fechaNacimiento);
        usuario.descripcion = datos.descripcion.trim();

        if (imagenSubida) {
            usuario.imagenPerfilUrl = imagenSubida.secure_url;
            usuario.imagenPerfilPublicId = imagenSubida.public_id;
        }

        try {
            await usuario.save();
        } catch (error: unknown) {
            if (imagenSubida) {
                try {
                    await this.cloudinaryService.eliminarImagen(imagenSubida.public_id);
                } catch {
                    this.logger.warn('No se pudo eliminar la imagen de una actualización de perfil fallida.');
                }
            }

            if (error instanceof mongo.MongoServerError && error.code === 11000) {
                throw new ConflictException('El nombre de usuario ya está registrado.');
            }

            throw error;
        }

        if (imagenSubida && imagenAnteriorPublicId && imagenAnteriorPublicId !== imagenSubida.public_id) {
            try {
                await this.cloudinaryService.eliminarImagen(imagenAnteriorPublicId);
            } catch {
                this.logger.warn('El perfil se actualizó, pero no se pudo eliminar la imagen anterior.');
            }
        }

        return {
            id: usuario._id.toString(),
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            correo: usuario.correo,
            nombreUsuario: usuario.nombreUsuario,
            fechaNacimiento: usuario.fechaNacimiento,
            descripcion: usuario.descripcion,
            imagenPerfilUrl: usuario.imagenPerfilUrl,
            rol: usuario.rol,
        };
    }

    findByCorreo(correo: string): Promise<UsuarioDocument | null> {
        return this.usuarioModel.findOne({ correo: correo.trim().toLowerCase() }).exec();
    }

    findByCorreoConContrasena(correo: string): Promise<UsuarioDocument | null> {
        return this.usuarioModel
            .findOne({ correo: correo.trim().toLowerCase() })
            .select('+contrasenaHash')
            .exec();
    }

    findByNombreUsuario(nombreUsuario: string): Promise<UsuarioDocument | null> {
        return this.usuarioModel.findOne({ nombreUsuario: nombreUsuario.trim() }).exec();
    }

    async saveUser(datos: DatosNuevoUsuario): Promise<UsuarioDocument> {

        const nuevoUsuario = new this.usuarioModel({
            nombre: datos.nombre,
            apellido: datos.apellido,
            correo: datos.correo,
            nombreUsuario: datos.nombreUsuario,
            contrasenaHash:  datos.contrasenaHash,
            fechaNacimiento: datos.fechaNacimiento,
            descripcion: datos.descripcion,
            imagenPerfilUrl: datos.imagenPerfilUrl,
            imagenPerfilPublicId: datos.imagenPerfilPublicId,
            rol: 'usuario',
        });

        try {
            return await nuevoUsuario.save();
        } catch (error: unknown) {
            if (error instanceof mongo.MongoServerError && error.code === 11000) {
                throw new ConflictException('El correo o el nombre de usuario ya está registrado.');
            }

            throw error;
        }
    }
}
