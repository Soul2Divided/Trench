import {
    IsDateString,
    IsEmail,
    IsNotEmpty,
    IsString,
    Matches,
    MinLength,
} from 'class-validator';

/**
 * Realiza las validaciones de los campos del DTO para el registro de un usuario.
 * Quien define la estructura de los datos que se van a guardar en la base de datos es el schema de usuarios,
 * este DTO solo valida que los datos que se envían desde el frontend cumplan con ciertos criterios antes de ser procesados.
 */
export class RegisterUsuarioDto {
    @IsString({ message: 'El nombre debe ser un texto.' })

    // /\S/ exige que haya al menos un carácter que no sea un espacio.
    @Matches(/\S/, { message: 'El nombre no puede estar vacío ni contener solo espacios.' })
    nombre: string;

    @IsString({ message: 'El apellido debe ser un texto.' })
    @Matches(/\S/, { message: 'El apellido no puede estar vacío ni contener solo espacios.' })
    apellido: string;

    @IsEmail({}, { message: 'El correo debe tener un formato válido.' })
    correo: string;

    @IsString({ message: 'El nombre de usuario debe ser un texto.' })
    @Matches(/\S/, { message: 'El nombre de usuario no puede estar vacío ni contener solo espacios.' })
    nombreUsuario: string;

    @IsString({ message: 'La contraseña debe ser un texto.' })
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
    @Matches(/[A-Z]/, { message: 'La contraseña debe incluir al menos una mayúscula.' })
    @Matches(/[0-9]/, { message: 'La contraseña debe incluir al menos un número.' })
    contrasena: string;

    @IsString({ message: 'La repetición de contraseña debe ser un texto.' })
    @IsNotEmpty({ message: 'Debe repetir la contraseña.' })
    repetirContrasena: string;

    @IsDateString(
        { strict: true },
        { message: 'La fecha de nacimiento debe ser una fecha válida, por ejemplo 2000-05-20.' },
    )
    fechaNacimiento: string;

    @IsString({ message: 'La descripción debe ser un texto.' })
    @Matches(/\S/, { message: 'La descripción no puede estar vacía ni contener solo espacios.' })
    descripcion: string;
}
