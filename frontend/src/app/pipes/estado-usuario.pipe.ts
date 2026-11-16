import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'estadoUsuario',
})
export class EstadoUsuarioPipe implements PipeTransform {
    transform(habilitado: boolean | null | undefined): string {
        if (habilitado === null || habilitado === undefined) {
            return 'Sin información';
        }

        return habilitado ? 'Habilitado' : 'Deshabilitado';
    }
}
