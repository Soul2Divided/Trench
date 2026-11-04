import { IsDateString, IsString, Matches, MaxLength } from 'class-validator';

export class ActualizarPerfilDto {
    @IsString({ message: 'El nombre debe ser un texto.' })
    @Matches(/\S/, { message: 'El nombre no puede estar vacío ni contener solo espacios.' })
    nombre: string;

    @IsString({ message: 'El apellido debe ser un texto.' })
    @Matches(/\S/, { message: 'El apellido no puede estar vacío ni contener solo espacios.' })
    apellido: string;

    @IsString({ message: 'El nombre de usuario debe ser un texto.' })
    @Matches(/\S/, { message: 'El nombre de usuario no puede estar vacío ni contener solo espacios.' })
    nombreUsuario: string;

    @IsDateString({ strict: true }, { message: 'La fecha de nacimiento no es válida.' })
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Usá el formato AAAA-MM-DD para la fecha de nacimiento.' })
    fechaNacimiento: string;

    @IsString({ message: 'La descripción debe ser un texto.' })
    @Matches(/\S/, { message: 'La descripción no puede estar vacía ni contener solo espacios.' })
    @MaxLength(250, { message: 'La descripción no puede superar los 250 caracteres.' })
    descripcion: string;
}
