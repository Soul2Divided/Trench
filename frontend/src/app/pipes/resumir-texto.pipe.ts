import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'resumirTexto',
})
export class ResumirTextoPipe implements PipeTransform {
    transform(texto: string | null | undefined, limite: number = 100): string {
        if (!texto) {
            return '';
        }

        if (!Number.isFinite(limite)) {
            return texto;
        }

        const cantidad = Math.max(0, Math.floor(limite));
        const caracteres = Array.from(texto);

        if (cantidad === 0) {
            return '';
        }

        if (caracteres.length <= cantidad) {
            return texto;
        }

        return `${caracteres.slice(0, cantidad).join('').trimEnd()}…`;
    }
}
