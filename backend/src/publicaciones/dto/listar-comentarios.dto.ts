import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class ListarComentariosDto {
    @Type(() => Number)
    @IsInt({ message: 'El offset debe ser un número entero.' })
    @Min(0, { message: 'El offset no puede ser negativo.' })
    offset: number = 0;

    @Type(() => Number)
    @IsInt({ message: 'El limit debe ser un número entero.' })
    @Min(1, { message: 'El limit debe ser al menos 1.' })
    @Max(50, { message: 'El limit no puede superar los 50 comentarios.' })
    limit: number = 5;
}
