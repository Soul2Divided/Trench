import { AfterViewInit, Directive, DoCheck, ElementRef, inject, OnDestroy, Renderer2 } from '@angular/core';

let siguienteContadorId = 0;

@Directive({
    selector: 'input[appContadorCaracteres], textarea[appContadorCaracteres]',
    exportAs: 'contadorCaracteres',
    host: {
        '(input)': 'actualizarContador()',
    },
})
export class ContadorCaracteresDirective implements AfterViewInit, DoCheck, OnDestroy {
    readonly contadorId = `contador-caracteres-${siguienteContadorId++}`;

    private readonly elemento = inject<ElementRef<HTMLInputElement | HTMLTextAreaElement>>(ElementRef);
    private readonly renderer = inject(Renderer2);

    private contador?: HTMLSpanElement;
    private textoAnterior = '';

    ngAfterViewInit(): void {
        const campo = this.elemento.nativeElement;
        const padre = this.renderer.parentNode(campo);

        if (!padre) {
            return;
        }

        this.contador = this.renderer.createElement('span');
        this.renderer.setAttribute(this.contador, 'id', this.contadorId);
        this.renderer.addClass(this.contador, 'form-hint');
        this.renderer.insertBefore(padre, this.contador, this.renderer.nextSibling(campo));

        const descripciones = campo.getAttribute('aria-describedby')?.split(/\s+/).filter(Boolean) ?? [];

        this.renderer.setAttribute(campo, 'aria-describedby', [...new Set([...descripciones, this.contadorId])].join(' '));
        this.actualizarContador();
    }

    ngDoCheck(): void {
        // También contempla valores cargados o reiniciados desde un formulario reactivo.
        this.actualizarContador();
    }

    ngOnDestroy(): void {
        const campo = this.elemento.nativeElement;
        const descripciones = (campo.getAttribute('aria-describedby') ?? '')
            .split(/\s+/)
            .filter(id => id && id !== this.contadorId);

        if (descripciones.length > 0) {
            this.renderer.setAttribute(campo, 'aria-describedby', descripciones.join(' '));
        } else {
            this.renderer.removeAttribute(campo, 'aria-describedby');
        }

        const padre = this.contador ? this.renderer.parentNode(this.contador) : null;

        if (padre) {
            this.renderer.removeChild(padre, this.contador);
        }
    }

    protected actualizarContador(): void {
        if (!this.contador) {
            return;
        }

        const campo = this.elemento.nativeElement;
        const cantidad = campo.value.length;
        const texto = campo.maxLength >= 0
            ? `${cantidad}/${campo.maxLength} caracteres`
            : `${cantidad} caracteres`;

        if (texto !== this.textoAnterior) {
            this.renderer.setProperty(this.contador, 'textContent', texto);
            this.textoAnterior = texto;
        }
    }
}
