import { Directive, effect, inject, TemplateRef, ViewContainerRef } from '@angular/core';

import { AutenticacionService } from '../services/autenticacion.service';

@Directive({
    selector: '[appSoloAdministrador]',
})
export class SoloAdministradorDirective {
    private readonly autenticacion = inject(AutenticacionService);
    private readonly plantilla = inject(TemplateRef<unknown>);
    private readonly contenedor = inject(ViewContainerRef);

    private visible = false;

    constructor() {
        effect(() => {
            const administrador = this.autenticacion.usuarioActual()?.rol === 'administrador';

            if (administrador === this.visible) {
                return;
            }

            this.visible = administrador;

            if (administrador) {
                this.contenedor.createEmbeddedView(this.plantilla);
            } else {
                this.contenedor.clear();
            }
        });
    }
}
