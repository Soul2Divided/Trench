import { IsString, Matches } from 'class-validator';

export class CrearPublicacionDto {
    @IsString({ message: 'El título debe ser un texto.' })
    @Matches(/\S/, { message: 'El título no puede estar vacío ni contener solo espacios.' })
    titulo: string;

    @IsString({ message: 'El mensaje debe ser un texto.' })
    @Matches(/\S/, { message: 'El mensaje no puede estar vacío ni contener solo espacios.' })
    mensaje: string;
}
