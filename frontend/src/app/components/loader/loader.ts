import { AfterViewInit, Component, ElementRef, input, viewChild } from '@angular/core';

/** Muestra un vinilo animado mientras el componente padre realiza una operación. */
@Component({
    selector: 'app-loader',
    templateUrl: './loader.html',
    styleUrl: './loader.scss',
})
export class Loader implements AfterViewInit {
    readonly titulo = input('Un momento');
    readonly mensaje = input('Estamos preparando todo.');

    private readonly dialogo = viewChild<ElementRef<HTMLDialogElement>>('dialogo');

    ngAfterViewInit(): void {
        this.dialogo()?.nativeElement.showModal();
    }

    protected mantenerAbierto(evento: Event): void {
        evento.preventDefault();
    }
}
