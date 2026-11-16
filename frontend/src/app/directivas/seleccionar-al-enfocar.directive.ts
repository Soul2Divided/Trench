import { afterNextRender, booleanAttribute, Directive, ElementRef, inject, Injector, input } from '@angular/core';

@Directive({
    selector: 'input[appSeleccionarAlEnfocar], textarea[appSeleccionarAlEnfocar]',
    host: {
        '(focus)': 'seleccionarContenido()',
    },
})
export class SeleccionarAlEnfocarDirective {
    readonly appSeleccionarAlEnfocar = input(true, { transform: booleanAttribute });

    private readonly elemento = inject<ElementRef<HTMLInputElement | HTMLTextAreaElement>>(ElementRef);
    private readonly injector = inject(Injector);

    protected seleccionarContenido(): void {
        // Espera a que se actualicen los errores enlazados cuando el formulario da el foco.
        afterNextRender(() => {
            const campo = this.elemento.nativeElement;
            const tiposConSeleccion = ['text', 'search', 'tel', 'url', 'password'];

            if (!this.appSeleccionarAlEnfocar() || campo.ownerDocument.activeElement !== campo) {
                return;
            }

            if (campo.tagName === 'INPUT' && !tiposConSeleccion.includes(campo.type)) {
                return;
            }

            campo.select();
        }, { injector: this.injector });
    }
}
