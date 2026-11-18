import { PasswordHasher } from '@nestjs/authentication';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { mongo } from 'mongoose';
import type { Model } from 'mongoose';
import { Usuario } from './schemas/usuario.schema.js';
import type { UsuarioDocument } from './schemas/usuario.schema.js';
import { CloudinaryService } from '../file/cloudinary.service.js';
import { RegisterUsuarioDto } from '../autenticacion/dto/register-usuario.dto.js';
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
    rol: Usuario['rol'];
}

const IMAGEN_PERFIL_PREDETERMINADA = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">'
    + '<rect width="96" height="96" rx="48" fill="#e2e8f0"/>'
    + '<circle cx="48" cy="35" r="17" fill="#64748b"/>'
    + '<path d="M17 88a31 31 0 0 1 62 0" fill="#64748b"/>'
    + '</svg>',
);

@Injectable()
export class UsuariosService {
    private readonly logger = new Logger(UsuariosService.name);

    constructor(
        @InjectModel(Usuario.name) private readonly usuarioModel: Model<Usuario>,
        private readonly cloudinaryService: CloudinaryService,
        private readonly passwordHasher: PasswordHasher,
    ) { }

    async obtenerPorId(id: string) {
        const usuario = await this.usuarioModel.findById(id).exec();

        if (!usuario) {
            throw new NotFoundException('El usuario no existe.');
        }

        return this.parsearUsuario(usuario);
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

    async listar() {
        const usuarios = await this.usuarioModel.find().sort({ nombreUsuario: 1, _id: 1 }).exec();

        return usuarios.map(usuario => this.parsearUsuario(usuario));
    }

    async crear(datos: RegisterUsuarioDto, imagen: Express.Multer.File | undefined, rol: Usuario['rol']) {
        if (datos.contrasena !== datos.repetirContrasena) {
            throw new BadRequestException('Las contraseñas no coinciden.');
        }

        const usuarioPorCorreo = await this.findByCorreo(datos.correo);

        if (usuarioPorCorreo) {
            throw new ConflictException('El correo ya está registrado.');
        }

        const usuarioPorNombre = await this.findByNombreUsuario(datos.nombreUsuario);

        if (usuarioPorNombre) {
            throw new ConflictException('El nombre de usuario ya está registrado.');
        }

        const contrasenaHash = await this.passwordHasher.hash(datos.contrasena);
        const imagenSubida = imagen
            ? await this.cloudinaryService.subirImagen(imagen.buffer)
            : undefined;
        let usuario: UsuarioDocument;

        try {
            usuario = await this.saveUser({
                nombre: datos.nombre,
                apellido: datos.apellido,
                correo: datos.correo,
                nombreUsuario: datos.nombreUsuario,
                contrasenaHash,
                fechaNacimiento: new Date(datos.fechaNacimiento),
                descripcion: datos.descripcion,
                imagenPerfilUrl: imagenSubida?.secure_url ?? IMAGEN_PERFIL_PREDETERMINADA,
                imagenPerfilPublicId: imagenSubida?.public_id ?? '',
                rol,
            });
        } catch (error: unknown) {
            if (imagenSubida) {
                try {
                    await this.cloudinaryService.eliminarImagen(imagenSubida.public_id);
                } catch {
                    this.logger.warn('No se pudo eliminar la imagen de un registro fallido.');
                }
            }

            throw error;
        }

        return this.parsearUsuario(usuario);
    }

    private async saveUser(datos: DatosNuevoUsuario): Promise<UsuarioDocument> {
        const nuevoUsuario = new this.usuarioModel({
            nombre: datos.nombre,
            apellido: datos.apellido,
            correo: datos.correo,
            nombreUsuario: datos.nombreUsuario,
            contrasenaHash: datos.contrasenaHash,
            fechaNacimiento: datos.fechaNacimiento,
            descripcion: datos.descripcion,
            imagenPerfilUrl: datos.imagenPerfilUrl,
            imagenPerfilPublicId: datos.imagenPerfilPublicId,
            rol: datos.rol,
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

        return this.parsearUsuario(usuario);
    }

    async obtenerUsuarioHabilitado(id: string) {
        let usuario;

        try {
            usuario = await this.obtenerPorId(id);
        } catch (error: unknown) {
            if (error instanceof NotFoundException) {
                throw new UnauthorizedException('El usuario de la sesión ya no existe.');
            }

            throw error;
        }

        if (!usuario.habilitado) {
            throw new ForbiddenException('Tu usuario está deshabilitado. No estás autorizado a ingresar.');
        }

        return usuario;
    }

    async cambiarHabilitacion(id: string, habilitado: boolean, administradorId: string) {
        if (!habilitado && id.toLowerCase() === administradorId.toLowerCase()) {
            throw new BadRequestException('No podés deshabilitar tu propio usuario.');
        }

        const usuario = await this.usuarioModel.findByIdAndUpdate(
            id,
            { $set: { habilitado } },
            { new: true, runValidators: true },
        ).exec();

        if (!usuario) {
            throw new NotFoundException('El usuario no existe.');
        }

        return this.parsearUsuario(usuario);
    }

    private parsearUsuario(usuario: UsuarioDocument) {
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
            habilitado: usuario.habilitado,
        };
    }
}
