import { IsDateString } from 'class-validator';

export class EstadisticasPeriodoDto {
    @IsDateString({}, { message: 'La fecha desde debe tener un formato válido.' })
    desde: string;

    @IsDateString({}, { message: 'La fecha hasta debe tener un formato válido.' })
    hasta: string;
}
