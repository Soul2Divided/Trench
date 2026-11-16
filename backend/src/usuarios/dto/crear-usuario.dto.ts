import { IsIn } from 'class-validator';
import { RegisterUsuarioDto } from '../../autenticacion/dto/register-usuario.dto.js';

export class CrearUsuarioDto extends RegisterUsuarioDto {
    @IsIn(['usuario', 'administrador'], { message: 'El rol debe ser usuario o administrador.' })
    rol: 'usuario' | 'administrador';
}
