import { PasswordHasher } from '@nestjs/authentication';
import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterUsuarioDto } from './dto/register-usuario.dto.js';
import { LoginUsuarioDto } from './dto/login-usuario.dto.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import type { UsuarioDocument } from '../usuarios/schemas/usuario.schema.js';
import { CloudinaryService } from '../file/cloudinary.service.js';

@Injectable()
export class AutenticacionService {
    constructor(
        private readonly passwordHasher: PasswordHasher,
        private readonly usuariosService: UsuariosService,
        private readonly cloudinaryService: CloudinaryService,
    ) { }

    /**
     * Registra un usuario con los datos ya validados y una imagen de perfil.
     * Si falla el guardado, intenta eliminar la imagen subida.
     *
     * @returns Los datos del usuario creado, sin el hash de su contraseña.
     */
    async registerUser(registerDto: RegisterUsuarioDto, imagen: Express.Multer.File) {
        if (registerDto.contrasena !== registerDto.repetirContrasena) {
            throw new BadRequestException('Las contraseñas no coinciden.');
        }

        const usuarioPorCorreo = await this.usuariosService.findByCorreo(registerDto.correo);

        if (usuarioPorCorreo) {
            throw new ConflictException('El correo ya está registrado.');
        }

        const usuarioPorNombre = await this.usuariosService.findByNombreUsuario(registerDto.nombreUsuario);

        if (usuarioPorNombre) {
            throw new ConflictException('El nombre de usuario ya está registrado.');
        }

        const contrasenaHash = await this.passwordHasher.hash(registerDto.contrasena);
        const imagenSubida = await this.cloudinaryService.subirImagen(imagen.buffer);
        let usuario: UsuarioDocument;

        try {
            usuario = await this.usuariosService.saveUser({
                nombre: registerDto.nombre,
                apellido: registerDto.apellido,
                correo: registerDto.correo,
                nombreUsuario: registerDto.nombreUsuario,
                contrasenaHash,
                fechaNacimiento: new Date(registerDto.fechaNacimiento),
                descripcion: registerDto.descripcion,
                imagenPerfilUrl: imagenSubida.secure_url,
                imagenPerfilPublicId: imagenSubida.public_id,
            });
        } catch (error: unknown) {
            try {
                await this.cloudinaryService.eliminarImagen(imagenSubida.public_id);
            } catch {
                console.log('No se pudo eliminar la imagen de un registro fallido.');
            }

            throw error;
        }

        return this.obtenerDatosPublicos(usuario);
    }

    /**
     * Verifica el correo y la contraseña contra el hash guardado.
     *
     * @returns Los datos del usuario, sin contraseña ni hash.
     * @throws UnauthorizedException si las credenciales son incorrectas.
     */
    async loginUser(loginDto: LoginUsuarioDto) {
        const usuario = await this.usuariosService.findByCorreoConContrasena(loginDto.correo);

        const contrasenaValida = await this.passwordHasher.verify(
            loginDto.contrasena,
            usuario?.contrasenaHash,
        );

        if (!usuario || !contrasenaValida) {
            throw new UnauthorizedException('El correo o la contraseña son incorrectos.');
        }

        return this.obtenerDatosPublicos(usuario);
    }

    private obtenerDatosPublicos(usuario: UsuarioDocument) {
        return {
            id: usuario._id.toString(),
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            correo: usuario.correo,
            nombreUsuario: usuario.nombreUsuario,
            fechaNacimiento: usuario.fechaNacimiento,
            descripcion: usuario.descripcion,
            imagenPerfilUrl: usuario.imagenPerfilUrl,
            perfil: usuario.perfil,
        };
    }
}
