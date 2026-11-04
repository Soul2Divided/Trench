import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AutenticacionService } from '../../services/autenticacion.service';

@Component({
    selector: 'app-panel-usuario',
    imports: [RouterLink, RouterLinkActive],
    templateUrl: './panel-usuario.html',
    styleUrl: './panel-usuario.scss',
})
export class PanelUsuario {
    private readonly autenticacion = inject(AutenticacionService);

    protected readonly usuario = this.autenticacion.usuarioActual;

    protected cerrarSesion(): void {
        this.autenticacion.cerrarSesion();
    }
}
