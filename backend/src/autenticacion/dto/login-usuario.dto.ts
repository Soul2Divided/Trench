import { IsEmail, IsString, Matches } from 'class-validator';

/**
 * Realiza las validaciones de los campos del DTO para el login de un usuario.
 * Quien define la estructura de los datos que se van a guardar en la base de datos es el schema de usuarios,
 * este DTO solo valida que los datos que se envían desde el frontend cumplan con ciertos criterios antes de ser procesados.
 */
export class LoginUsuarioDto {
    @IsEmail({}, { message: 'El correo debe tener un formato válido.' })
    correo: string;

    @IsString({ message: 'La contraseña debe ser un texto.' })
    @Matches(/\S/, { message: 'La contraseña no puede estar vacía ni contener solo espacios.' })
    contrasena: string;
}
