import { Type } from 'class-transformer';
import { IsIn, IsInt, IsMongoId, IsOptional, Max, Min } from 'class-validator';

export class ListarPublicacionesDto {
    @Type(() => Number)
    @IsInt({ message: 'El offset debe ser un número entero.' })
    @Min(0, { message: 'El offset no puede ser negativo.' })
    offset: number = 0;

    @Type(() => Number)
    @IsInt({ message: 'El limit debe ser un número entero.' })
    @Min(1, { message: 'El limit debe ser al menos 1.' })
    @Max(50, { message: 'El limit no puede superar las 50 publicaciones.' })
    limit: number = 5;

    @IsIn(['fecha', 'meGusta'], { message: 'El orden debe ser fecha o meGusta.' })
    orden: 'fecha' | 'meGusta' = 'fecha';

    @IsOptional()
    @IsMongoId({ message: 'El identificador del usuario no es válido.' })
    usuarioId?: string;

    @IsOptional()
    @IsMongoId({ message: 'El identificador del usuario actual no es válido.' })
    usuarioActualId?: string;
}
