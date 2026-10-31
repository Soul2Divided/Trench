import { AfterViewInit, Component, ElementRef, input, output, viewChild } from '@angular/core';

export interface MensajeModal {
    tipo: 'success' | 'error' | 'info';
    titulo: string;
    mensaje: string;
    textoBoton?: string;
}

@Component({
    selector: 'app-modal',
    templateUrl: './modal.html',
    styleUrl: './modal.scss',
})
export class Modal implements AfterViewInit {
    readonly mensaje = input.required<MensajeModal>();
    readonly cerrado = output<void>();

    private readonly dialogo = viewChild<ElementRef<HTMLDialogElement>>('dialogo');

    ngAfterViewInit(): void {
        this.dialogo()?.nativeElement.showModal();
    }

    protected cerrarConEscape(evento: Event): void {
        evento.preventDefault();
        this.cerrar();
    }

    protected cerrar(): void {
        this.dialogo()?.nativeElement.close();
        this.cerrado.emit();
    }
}
