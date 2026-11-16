import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AutenticacionService } from '../../services/autenticacion.service';
import { MensajeModal, Modal } from '../modal/modal';

import { ImagenRespaldoDirective } from '../../directivas/imagen-respaldo.directive';
import { SoloAdministradorDirective } from '../../directivas/solo-administrador.directive';

@Component({
    selector: 'app-panel-usuario',
    imports: [ImagenRespaldoDirective, SoloAdministradorDirective, RouterLink, RouterLinkActive, Modal],
    templateUrl: './panel-usuario.html',
    styleUrl: './panel-usuario.scss',
})
export class PanelUsuario {
    private readonly autenticacion = inject(AutenticacionService);

    protected readonly usuario = this.autenticacion.usuarioActual;
    protected readonly confirmacionCierre = signal<MensajeModal | null>(null);

    protected solicitarCierreSesion(): void {
        this.confirmacionCierre.set({
            tipo: 'info',
            titulo: '¿Cerrar sesión?',
            mensaje: 'Vas a salir de tu cuenta en este dispositivo.',
            textoBoton: 'Cancelar',
            textoConfirmar: 'Cerrar sesión',
        });
    }

    protected confirmarCierreSesion(): void {
        this.confirmacionCierre.set(null);
        this.autenticacion.cerrarSesion();
    }
}
