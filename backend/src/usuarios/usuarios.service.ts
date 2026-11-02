import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { mongo } from 'mongoose';
import type { Model } from 'mongoose';
import { Usuario } from './schemas/usuario.schema.js';
import type { UsuarioDocument } from './schemas/usuario.schema.js';

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
    constructor(
        @InjectModel(Usuario.name) private readonly usuarioModel: Model<Usuario>,
    ) {}

    findById(id: string): Promise<UsuarioDocument | null> {
        return this.usuarioModel.findById(id).exec();
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
            perfil: 'usuario',
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
