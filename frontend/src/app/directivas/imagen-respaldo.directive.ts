import { AfterViewInit, Directive, DoCheck, ElementRef, inject, input, Renderer2 } from '@angular/core';

const AVATAR_PREDETERMINADO = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">'
    + '<rect width="96" height="96" rx="48" fill="#e2e8f0"/>'
    + '<circle cx="48" cy="35" r="17" fill="#64748b"/>'
    + '<path d="M17 88a31 31 0 0 1 62 0" fill="#64748b"/>'
    + '</svg>',
);

@Directive({
    selector: 'img[appImagenRespaldo]',
    host: {
        '(error)': 'mostrarRespaldo()',
    },
})
export class ImagenRespaldoDirective implements AfterViewInit, DoCheck {
    readonly appImagenRespaldo = input(AVATAR_PREDETERMINADO);

    private readonly elemento = inject<ElementRef<HTMLImageElement>>(ElementRef);
    private readonly renderer = inject(Renderer2);

    ngAfterViewInit(): void {
        this.comprobarImagen();
    }

    ngDoCheck(): void {
        this.comprobarImagen();
    }

    private comprobarImagen(): void {
        if (!this.elemento.nativeElement.getAttribute('src')?.trim()) {
            this.mostrarRespaldo();
        }
    }

    protected mostrarRespaldo(): void {
        const imagen = this.elemento.nativeElement;
        const respaldo = this.appImagenRespaldo() || AVATAR_PREDETERMINADO;

        if (imagen.getAttribute('src') === respaldo) {
            return;
        }

        this.renderer.removeAttribute(imagen, 'srcset');
        this.renderer.setAttribute(imagen, 'src', respaldo);
    }
}
