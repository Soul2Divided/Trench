import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class CrearComentarioDto {
    @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
    @IsString({ message: 'El comentario debe ser un texto.' })
    @IsNotEmpty({ message: 'El comentario no puede estar vacío.' })
    mensaje: string;
}
