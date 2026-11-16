import { inject, Pipe, PipeTransform } from '@angular/core';

import { RelojService } from '../services/reloj.service';

@Pipe({
    name: 'tiempoTranscurrido',
    pure: false,
})
export class TiempoTranscurridoPipe implements PipeTransform {
    private readonly reloj = inject(RelojService);

    transform(fecha: string | number | Date | null | undefined, ahora: number = this.reloj.ahora()): string {
        if (fecha === null || fecha === undefined || fecha === '') {
            return '';
        }

        const instante = fecha instanceof Date ? fecha.getTime() : new Date(fecha).getTime();

        if (!Number.isFinite(instante) || !Number.isFinite(ahora)) {
            return '';
        }

        const segundos = Math.floor(Math.max(0, ahora - instante) / 1000);

        if (segundos < 60) {
            return 'Hace un momento';
        }

        const unidades = [
            { segundos: 31536000, singular: 'año', plural: 'años' },
            { segundos: 2592000, singular: 'mes', plural: 'meses' },
            { segundos: 86400, singular: 'día', plural: 'días' },
            { segundos: 3600, singular: 'hora', plural: 'horas' },
            { segundos: 60, singular: 'minuto', plural: 'minutos' },
        ];

        for (const unidad of unidades) {
            if (segundos >= unidad.segundos) {
                const cantidad = Math.floor(segundos / unidad.segundos);

                return `Hace ${cantidad} ${cantidad === 1 ? unidad.singular : unidad.plural}`;
            }
        }

        return 'Hace un momento';
    }
}
