import { IsMongoId } from 'class-validator';

export class DarMeGustaDto {
    @IsMongoId({ message: 'El identificador del usuario no es válido.' })
    usuarioId: string;
}
